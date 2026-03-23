
Root cause: the request for `endpoint=lectures` is being sent without an `Authorization` header, so the backend proxy rejects it with `401 Unauthorized` before it ever reaches the Python API.

Evidence from the code and logs:
- Network log shows the failing request only has:
  - `apikey`
  - `x-cohort-id`
  - no `Authorization`
- The edge function explicitly requires auth at the top:
  - `const authHeader = req.headers.get("Authorization");`
  - if missing, it returns `{"error":"Unauthorized"}` with status `401`
- In `src/pages/ProfessorAI.tsx`, the lectures fetch only adds the auth header if `supabase.auth.getSession()` returns an access token.
- That fetch runs immediately when `selectedBatch` or `mode` changes, which can happen before the auth session is fully available/hydrated in the browser.
- Result: Notes / Pre-Read trigger the lectures fetch too early, the token is empty, and the request dies at the edge function.
- Analytics works because those requests are made later, from mounted tab views, after the session is already available.

Why it looks like a blank-screen/runtime error:
- The failing lectures call is surfaced by the app as a runtime error coming from `professor-chat?endpoint=lectures...`
- The actual failure is still just the 401 from the missing auth header; the “blank screen” is the frontend error handling/UI reaction, not a crash inside the backend function logic.

Implementation plan:
1. In `ProfessorAI.tsx`, gate `fetchLectures()` so it does not run until there is a valid authenticated session with `access_token`.
2. Add session hydration handling:
   - read the current session once on mount
   - subscribe to `supabase.auth.onAuthStateChange(...)`
   - only fetch lectures when auth is ready
3. If no token exists yet, do not call the edge function; keep loading or retry once auth resolves instead of sending an unauthenticated request.
4. Optionally centralize token retrieval into a small helper so all professor-mode requests behave consistently.
5. Verify that Notes Creator and Pre-Read now send:
   - `Authorization: Bearer <token>`
   - `x-cohort-id`
   - `mode=Notes Creator` or `mode=Pre-Read`

Expected result after the fix:
- The lectures request will actually reach the edge function authenticated
- The edge function will forward the request to the backend
- Notes Creator and Pre-Read will load lecture data normally instead of failing immediately with 401
