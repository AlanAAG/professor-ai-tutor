

# Fix Table Horizontal Scroll Without Moving Whole Screen

## Problem
The AI message container (`div` on line 299 and 304-305) uses `overflow-hidden`, which clips the table's horizontal scroll. Meanwhile `min-w-full` on the table forces it to be at least viewport-wide, making non-table text also render wide and unreadable.

## Solution

Two changes in `src/components/professor-ai/ProfessorMessage.tsx`:

1. **Table wrapper**: Change from `overflow-hidden` to `overflow-x-auto` on the message content div (line 305), so child elements like the table wrapper can scroll horizontally. Actually, the better fix: keep `overflow-hidden` on the outer div but change the table's own wrapper to use `overflow-x-auto` with `isolate` positioning so it creates its own scrolling context.

   The real fix: The table wrapper (line 165) already has `overflow-x-auto`, but the parent div (line 305) has `overflow-hidden` which clips it. Change line 305's `overflow-hidden` to `overflow-x-clip` — this clips text overflow but still allows child scroll containers to work. Actually `overflow-x-clip` isn't widely supported.

   **Simplest correct fix**: On line 305, remove `overflow-hidden` and keep `[overflow-wrap:anywhere]` for text wrapping. Then on the table wrapper (line 165), ensure it's self-contained. The `max-w-full` + `overflow-x-auto` on the wrapper will handle it.

2. **Table element**: Change `min-w-full` back to just letting the table size naturally via `w-max` so it doesn't force full width — it should only be as wide as its content needs.

### Changes in `ProfessorMessage.tsx`:
- **Line 165**: Table wrapper — keep `overflow-x-auto max-w-full` (already correct)
- **Line 166**: Table element — change `min-w-full` to `w-max` so the table is content-sized
- **Line 299**: Outer AI div — change `overflow-hidden` to `overflow-x-hidden` (or keep as is since line 304 is the real constraint)
- **Line 304-305**: Message text div — remove `overflow-hidden` and replace with just `min-w-0` to allow the table's scroll to work while still constraining text via `[overflow-wrap:anywhere]` and `break-words`

