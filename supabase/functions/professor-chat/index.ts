import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cohort-id",
};

const PROFESSOR_API_URL = "https://professor-agent-platform.onrender.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RENDER_API_KEY");
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");
    const mode = url.searchParams.get("mode");
    
    // Get cohort from header (default to 2029)
    const cohortId = req.headers.get("x-cohort-id") || "2029";

    // Fetch lectures endpoint
    if (endpoint === "lectures") {
      console.log(`Fetching lectures for cohort: ${cohortId} with mode: ${mode}`);

      const fetchLectures = async (cohortHeaderValue: string) => {
        // FIX: Pass the mode parameter to the backend
        const lectureUrl = mode
          ? `${PROFESSOR_API_URL}/api/lectures?mode=${encodeURIComponent(mode)}`
          : `${PROFESSOR_API_URL}/api/lectures`;

        const res = await fetch(lectureUrl, {
          headers: {
            "x-api-key": apiKey,
            "x-cohort-id": cohortHeaderValue,
            "Accept": "application/json",
          },
        });

        const text = await res.text();
        console.log(
          `Lectures response for x-cohort-id=${cohortHeaderValue}: status=${res.status} bodyPreview=${text.slice(0, 500)}`
        );

        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (e) {
          console.error("Failed to parse lectures JSON:", e);
        }

        return { res, json, rawText: text };
      };

      // First attempt
      let { res, json } = await fetchLectures(cohortId);

      // Retry logic for cohort prefix
      const lectures = (json?.lectures ?? []) as unknown[];
      if (res.ok && Array.isArray(lectures) && lectures.length === 0 && !cohortId.startsWith("cohort_")) {
        console.log(`Empty lectures for cohort ${cohortId}; retrying with cohort_${cohortId}`);
        const retry = await fetchLectures(`cohort_${cohortId}`);
        res = retry.res;
        json = retry.json;
      }

      if (!res.ok) {
        console.error("Failed to fetch lectures:", res.status);
        throw new Error(`Backend returned ${res.status}`);
      }

      console.log("Lectures fetched:", JSON.stringify(json));
      return new Response(JSON.stringify(json ?? { lectures: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chat endpoint - POST requests
    const body = await req.json();
    console.log("Chat request:", JSON.stringify(body));
    
    // Build system message with formatting instructions
    const systemInstructions = `When providing Excel formulas, ALWAYS wrap them in Markdown code blocks (e.g., \`=SUM(A1:B1)\`).

When providing Mathematical equations, ALWAYS use LaTeX wrapped in double dollar signs (e.g., $$x = \\frac{-b}{2a}$$).

Use clear bullet points and bold text for lists of definitions.`;

    // Prepend system message if not already present
    const messages = body.messages || [];
    const hasSystemMessage = messages.length > 0 && messages[0].role === "system";
    const finalMessages = hasSystemMessage 
      ? [{ ...messages[0], content: `${systemInstructions}\n\n${messages[0].content}` }, ...messages.slice(1)]
      : [{ role: "system", content: systemInstructions }, ...messages];

    // Build payload with mode
    const payload = {
      messages: finalMessages,
      mode: body.mode || "Study",
      selectedCourse: body.selectedCourse || null,
      selectedLecture: body.selectedLecture === "__all__" ? null : (body.selectedLecture || null),
      cohort_id: body.cohort_id || cohortId,
      session_id: body.session_id || null,
      expertise_level: body.expertise_level || null, // Adaptive learning - user's expertise level
    };

    console.log("Sending to backend:", JSON.stringify(payload));

    const response = await fetch(`${PROFESSOR_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-cohort-id": cohortId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    // Handle Streaming Response
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Handle JSON Response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Professor chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
