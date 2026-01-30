
# Implementation Plan: Diagnostic Quiz with Event-Based Persona Shift

## Overview
This plan adds a **diagnostic quiz system** that allows the AI to trigger an inline assessment quiz during the chat. When the backend sends a `DIAGNOSTIC_EVENT`, the frontend will render an interactive quiz with multiple-choice questions that **require reasoning justification** for each answer. Upon submission, results are sent to the backend, which can then trigger a `SYSTEM_EVENT` for persona shifts.

---

## Architecture Diagram

```text
+------------------+     DIAGNOSTIC_EVENT      +-------------------+
|   Backend API    | -----------------------> |  useProfessorChat |
|                  |                           |    (hook)         |
+------------------+                           +-------------------+
                                                        |
                                                        v
                                              +-------------------+
                                              |  ProfessorChat    |
                                              |  (component)      |
                                              +-------------------+
                                                        |
                                      renders when diagnosticQuiz state is set
                                                        v
                                              +-------------------+
                                              | DiagnosticQuiz    |
                                              |  (new component)  |
                                              +-------------------+
                                                        |
                                           on submit (POST /api/submit-diagnostic)
                                                        v
                                              +-------------------+
                                              |   Backend API     |
                                              +-------------------+
                                                        |
                                               SYSTEM_EVENT: persona_shift
                                                        v
                                              +-------------------+
                                              |   Toast Notify    |
                                              +-------------------+
```

---

## Components to Create/Modify

### 1. New File: `src/components/professor-ai/DiagnosticQuiz.tsx`

A card-based quiz interface with the following features:

**UI Structure:**
- Card container with header showing quiz title/topic
- Progress indicator (Question X of Y)
- Question text display
- Multiple-choice options (A, B, C, D) as selectable cards
- **Required** textarea: "Why did you choose this? (Required)"
- Character counter for reasoning (minimum 20 characters)
- Submit button (disabled until both option and reasoning are filled)
- Final submit to send all answers

**State Management:**
- `answers`: Array tracking `{ q_id, selected, reasoning }` for each question
- `currentIndex`: Current question being viewed
- `isSubmitting`: Loading state during submission

**Props Interface:**
```typescript
interface DiagnosticQuestion {
  q_id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
}

interface DiagnosticQuizData {
  topic_slug: string;
  title: string;
  questions: DiagnosticQuestion[];
}

interface DiagnosticQuizProps {
  quiz: DiagnosticQuizData;
  onSubmit: (payload: DiagnosticSubmission) => Promise<void>;
  onClose: () => void;
}

interface DiagnosticSubmission {
  topic_slug: string;
  answers: Array<{
    q_id: string;
    selected: "A" | "B" | "C" | "D";
    reasoning: string;
  }>;
}
```

---

### 2. Modify: `src/components/professor-ai/types.ts`

Add new types for diagnostic events and system events:

```typescript
// Diagnostic Quiz types
export interface DiagnosticQuestion {
  q_id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
}

export interface DiagnosticQuizData {
  topic_slug: string;
  title: string;
  questions: DiagnosticQuestion[];
}

// System Event types
export interface SystemEvent {
  type: "persona_shift" | string;
  persona?: string;
  message?: string;
}
```

---

### 3. Modify: `src/hooks/useProfessorChat.ts`

Add event detection patterns and state management:

**New Patterns:**
```typescript
const DIAGNOSTIC_EVENT_PATTERN = /DIAGNOSTIC_EVENT:\s*(\{[\s\S]*?\})/;
const SYSTEM_EVENT_PATTERN = /SYSTEM_EVENT:\s*(\{[\s\S]*?\})/;
```

**New State:**
```typescript
const [diagnosticQuiz, setDiagnosticQuiz] = useState<DiagnosticQuizData | null>(null);
```

**Stream Processing Updates:**
- Detect `DIAGNOSTIC_EVENT` in accumulated content
- Parse the JSON payload and set `diagnosticQuiz` state
- Strip the event tag from displayed content
- Detect `SYSTEM_EVENT` with `type: "persona_shift"` and show toast

**New Function:**
```typescript
const submitDiagnostic = async (payload: DiagnosticSubmission) => {
  // POST to /api/submit-diagnostic via edge function or direct
  // Handle response and close diagnostic quiz
  // May trigger follow-up message from AI
};
```

**Updated Return:**
```typescript
return {
  // ... existing
  diagnosticQuiz,
  setDiagnosticQuiz,
  submitDiagnostic,
};
```

---

### 4. Modify: `src/components/professor-ai/ProfessorChat.tsx`

**New Props:**
```typescript
diagnosticQuiz?: DiagnosticQuizData | null;
onDiagnosticSubmit?: (payload: DiagnosticSubmission) => Promise<void>;
onDiagnosticClose?: () => void;
```

**Render Logic Update:**
- When `diagnosticQuiz` is set, render `<DiagnosticQuiz />` inline in the chat area (after messages, before input)
- Style similar to the calibration request block (centered, prominent)

**Integration Point (around line 527):**
```tsx
{/* Diagnostic Quiz - rendered inline when triggered */}
{diagnosticQuiz && (
  <div className="shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-xl p-4 md:p-6 w-full">
    <div className="max-w-3xl mx-auto">
      <DiagnosticQuiz
        quiz={diagnosticQuiz}
        onSubmit={onDiagnosticSubmit}
        onClose={onDiagnosticClose}
      />
    </div>
  </div>
)}
```

---

### 5. Modify: `src/pages/ProfessorAI.tsx` (if needed)

Pass new props from `useProfessorChat` down to `ProfessorChat`:
- `diagnosticQuiz`
- `onDiagnosticSubmit`
- `onDiagnosticClose`

---

### 6. Optional: New Edge Function `submit-diagnostic`

If the backend expects the frontend to proxy through Supabase:

**File:** `supabase/functions/submit-diagnostic/index.ts`

```typescript
// POST handler
// Forwards payload to PROFESSOR_API_URL/api/submit-diagnostic
// Returns response or streams follow-up
```

---

## Event Format (Backend Contract)

**DIAGNOSTIC_EVENT (from backend):**
```
DIAGNOSTIC_EVENT: {
  "topic_slug": "statistics_basics",
  "title": "Statistics Knowledge Check",
  "questions": [
    {
      "q_id": "q1",
      "question": "What is the mean of [5, 10, 15]?",
      "options": { "A": "5", "B": "10", "C": "15", "D": "30" }
    }
  ]
}
```

**SYSTEM_EVENT (from backend):**
```
SYSTEM_EVENT: { "type": "persona_shift", "persona": "Supportive Coach" }
```

---

## User Experience Flow

1. User asks a question in Study mode
2. AI determines a diagnostic quiz is needed to calibrate
3. Backend sends `DIAGNOSTIC_EVENT` in the stream
4. Frontend parses event, hides input bar, shows DiagnosticQuiz inline
5. User answers each question with reasoning
6. User submits quiz
7. Frontend POSTs to `/api/submit-diagnostic`
8. Backend processes and may return `SYSTEM_EVENT: { "type": "persona_shift" }`
9. Frontend shows toast: "Switching to Supportive Coach Mode"
10. Quiz closes, chat continues with adjusted persona

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/professor-ai/DiagnosticQuiz.tsx` | CREATE |
| `src/components/professor-ai/types.ts` | MODIFY (add types) |
| `src/hooks/useProfessorChat.ts` | MODIFY (add event parsing) |
| `src/components/professor-ai/ProfessorChat.tsx` | MODIFY (render quiz inline) |
| `src/pages/ProfessorAI.tsx` | MODIFY (pass new props) |
| `supabase/functions/submit-diagnostic/index.ts` | CREATE (optional) |

---

## Technical Considerations

1. **Validation:** Reasoning textarea requires minimum 20 characters before enabling submit
2. **Accessibility:** Focus management when quiz appears/disappears
3. **Error Handling:** Toast on submission failure with retry option
4. **Streaming Compatibility:** Event detection works with both SSE streaming and JSON responses
5. **State Reset:** Clear diagnostic quiz state when mode/course changes
