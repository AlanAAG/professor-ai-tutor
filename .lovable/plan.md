

# Backend Integration: Analytics, Guardrails, Hint Counter, and Tab Navigation

## Overview

Four new feature areas integrated via the existing `professor-chat` edge function proxy, with tab-based navigation in the header. Code sandbox deferred.

---

## 1. Edge Function Proxy — New Endpoints

**File**: `supabase/functions/professor-chat/index.ts`

Add new endpoint routing for:
- `endpoint=analytics-cohort` → `GET /analytics/cohort/{cohort_id}`
- `endpoint=analytics-student` → `GET /analytics/student/{user_id}`
- `endpoint=guardrails-get` → `GET /guardrails/{course_key}?cohort_id=X`
- `endpoint=guardrails-set` → `POST /guardrails/set`
- `endpoint=socratic-update` → `POST /socratic/update`

These follow the same pattern as the existing `endpoint=lectures` and `endpoint=submit-diagnostic` routing.

---

## 2. Types

**File**: `src/components/professor-ai/types.ts`

Add interfaces:
- `CohortAnalyticsTopic` — `{ topic, gap_count, mastery_count, gap_rate, avg_attempts, most_common_bloom_gap }`
- `StudentMastery` — `{ topic, status, bloom_level_achieved }`
- `StudentBlindSpot` — `{ topic, gap_count, last_seen }`
- `GuardrailsConfig` — `{ professor_id, course_key, cohort_id, max_hints_per_concept, socratic_mode_enforced, direct_answer_bloom_threshold, restricted_topics, allowed_modes }`
- `SocraticState` — `{ hints_given, max_hints, resolved, resolution_type, student_attempts }`
- `HeaderTab` — `"chat" | "analytics" | "guardrails"`

---

## 3. Tab Navigation in Header

**File**: `src/components/professor-ai/ProfessorHeader.tsx`

Add a tab bar below the existing selectors row. Three tabs: **Chat**, **My Progress**, **Settings** (admin-only for guardrails). The active tab is controlled by a new `activeTab` prop passed from `ProfessorAI.tsx`. On mobile, tabs render as compact pill buttons.

**File**: `src/pages/ProfessorAI.tsx`

Add `activeTab` state. When tab changes, render the appropriate view component instead of ChatView/QuizView. Pass `isAdmin` to header to conditionally show the Settings tab.

---

## 4. Student Progress Page

**New file**: `src/components/professor-ai/StudentProgressView.tsx`

- On mount, fetch `GET /analytics/student/{user_id}` via the edge function proxy
- Display two sections:
  - **Mastery table**: topic, status (badge: green "Mastery" / red "Gap"), bloom level achieved
  - **Blind Spots**: cards showing recurring weak topics with gap count and last seen date
- Loading skeleton while fetching

---

## 5. Cohort Analytics (Professor Dashboard)

**New file**: `src/components/professor-ai/CohortAnalyticsView.tsx`

- Only visible to admin users
- Fetches `GET /analytics/cohort/{cohort_id}` via proxy
- Renders a table with columns: Topic, Gap Count, Mastery Count, Gap Rate (%), Avg Attempts, Most Common Bloom Gap
- Color-coding: `gap_rate > 60%` → red badge, `> 40%` → orange, else green
- Alert banner at top if any topic has `gap_rate > 60`

---

## 6. Guardrails Settings Panel

**New file**: `src/components/professor-ai/GuardrailsView.tsx`

- Admin-only view
- On mount, fetch current guardrails via `GET /guardrails/{course_key}?cohort_id=X`
- Form with:
  - `max_hints_per_concept` (number input)
  - `socratic_mode_enforced` (switch)
  - `direct_answer_bloom_threshold` (select: remember/understand/apply/analyze/evaluate/create)
  - `restricted_topics` (comma-separated text input)
  - `allowed_modes` (multi-select checkboxes)
- Save button → `POST /guardrails/set`
- Toast on success/failure

---

## 7. Hint Counter in Chat UI

**Files**: `src/hooks/useProfessorChat.ts`, `src/components/professor-ai/ProfessorChat.tsx`

### Hook changes (`useProfessorChat.ts`):
- Add `socraticState` to hook state (type `SocraticState | null`)
- After the AI response is finalized in Study mode, call `POST /socratic/update` via the edge function proxy with `{ user_id, session_id, concept (extracted from last user message), student_attempt, was_correct: false, course_key }`
- Store the returned `{ hints_given, max_hints, resolved, resolution_type }` in state
- Expose `socraticState` from the hook

### Chat UI changes (`ProfessorChat.tsx`):
- When `socraticState` exists and `socraticState.max_hints > 0`, render a small pill badge above the input area: "Hint {hints_given} of {max_hints}"
- When `resolved: true` and `resolution_type: "hints_exhausted"`, show a subtle banner: "Switching to direct answers"

---

## 8. Ensure Required Fields in Chat Request

**File**: `src/hooks/useProfessorChat.ts`

The chat request body already sends `user_id`, `session_id`, `cohort_id`, and `selectedCourse`. Verify `selected_course_key` mapping — the backend expects `course_key` so add an alias `course_key: selectedCourse` to the payload alongside the existing `selectedCourse` field for backward compatibility.

---

## File Summary

| File | Action |
|------|--------|
| `supabase/functions/professor-chat/index.ts` | Edit — add 5 new endpoint routes |
| `src/components/professor-ai/types.ts` | Edit — add analytics/guardrails/socratic types |
| `src/components/professor-ai/ProfessorHeader.tsx` | Edit — add tab bar |
| `src/pages/ProfessorAI.tsx` | Edit — add tab state, conditionally render views |
| `src/components/professor-ai/StudentProgressView.tsx` | Create |
| `src/components/professor-ai/CohortAnalyticsView.tsx` | Create |
| `src/components/professor-ai/GuardrailsView.tsx` | Create |
| `src/hooks/useProfessorChat.ts` | Edit — add socratic state + POST call |
| `src/components/professor-ai/ProfessorChat.tsx` | Edit — hint counter badge |

