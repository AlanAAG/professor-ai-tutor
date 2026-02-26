

# Inline Diagnostic Quiz - Chat-Native Design

## Problem
The diagnostic quiz currently renders as a separate card panel below the chat (in the footer area), visually disconnected from the conversation. The user wants it to feel like part of the chat -- as if the AI is asking questions in a "pen and paper exam" style, inline with the messages.

## Solution
Redesign the `DiagnosticQuiz` component to render as an AI message bubble (matching `ProfessorMessage` styling), and move it from the footer into the scrollable messages area. All questions are shown at once (no pagination), with radio-dot selection and a single "Submit Quiz" button at the bottom.

---

## Changes

### 1. Rewrite `src/components/professor-ai/DiagnosticQuiz.tsx`

Replace the current Card-based paginated UI with a chat-native layout:

**Structure:**
- Renders like an AI message (same left-aligned layout with Sparkles avatar)
- Title/topic shown as a header line
- ALL questions listed vertically (no pagination/Next/Previous)
- Each question: numbered text, radio-dot options (small circles like a paper exam)
- Selected option gets a filled dot + highlight
- A single "Submit Quiz" button at the bottom
- Loading state on submit

**Visual style:**
```text
[Sparkles Avatar]  Knowledge Check: Statistics Basics
                   
                   1. What is the mean of [5, 10, 15]?
                      ○ A) 5
                      ● B) 10      <-- selected, filled dot
                      ○ C) 15
                      ○ D) 30

                   2. What does standard deviation measure?
                      ○ A) Central tendency
                      ○ B) Spread of data
                      ...

                   [ Submit Quiz ]
```

**Key details:**
- No Card/CardHeader/CardContent -- just divs styled to match chat messages
- Uses simple circular radio indicators (CSS dots, not Radix RadioGroup)
- All questions visible, content scrolls naturally with the chat
- Submit button disabled until all questions answered
- Progress indicator: "X of Y answered" near submit button

### 2. Modify `src/components/professor-ai/ProfessorChat.tsx`

Move the diagnostic quiz rendering from the footer (lines 555-566) into the messages scroll area (around line 537, before `messagesEndRef`).

**Remove:** The footer `diagnosticQuiz` block (lines 555-566)

**Add:** Inside the messages `<div>` (after streaming content, before `messagesEndRef`):
```tsx
{diagnosticQuiz && onDiagnosticSubmit && (
  <DiagnosticQuiz
    quiz={diagnosticQuiz}
    onSubmit={onDiagnosticSubmit}
    onClose={onDiagnosticClose || (() => {})}
  />
)}
```

**Also update:** The input area condition (line 569) -- remove `!diagnosticQuiz` so the input bar stays visible even during the quiz (since the quiz is now just another message in the flow).

---

## Technical Details

### DiagnosticQuiz.tsx -- New Component Structure

```typescript
// Imports: Sparkles, Loader2, CheckCircle2 from lucide-react
// Button from ui/button, cn from lib/utils
// Types from ./types

// State:
// - answers: Array<{ q_id, selected }> -- one per question, no pagination index needed
// - isSubmitting: boolean

// Render:
// - Outer div matching AI message layout (flex gap-4, same as ProfessorMessage)
// - Avatar circle (Sparkles icon, gradient background)
// - Content div with:
//   - Title header
//   - Questions mapped vertically with radio options
//   - Answered count + Submit button
```

### Option rendering per question:
- Each option is a `<button>` with a circular indicator
- Unselected: empty circle border (`w-4 h-4 rounded-full border-2 border-muted-foreground/40`)
- Selected: filled primary circle (`bg-primary border-primary` with inner dot)
- Option text next to the dot

### Files Summary

| File | Action |
|------|--------|
| `src/components/professor-ai/DiagnosticQuiz.tsx` | REWRITE -- chat-native inline layout |
| `src/components/professor-ai/ProfessorChat.tsx` | MODIFY -- move quiz into messages area, keep input visible |

