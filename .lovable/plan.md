

# Fix Markdown Table Rendering & Input Bar Position Issues

This plan addresses two bugs you've reported in the Professor AI chat interface.

---

## Issue 1: Tables Not Rendering Properly

**What's happening:**
The AI sometimes returns tables where all rows are collapsed into a single line without proper newline separators. For example:
```
| Quantitative | Numbers you can measure | Age: 18, 19, 20 | | | | Price: $10, $15, $20 |
```
This happens because the backend sends malformed table data without proper newlines between rows.

**Current fix attempt:**
The `fixMarkdownTables` function in `src/lib/utils.ts` tries to fix this, but it only handles lines that contain `|---` or `|:--` (separator rows). It doesn't handle the data rows that are also collapsed.

**Why the current fix fails:**
- The function only activates on lines containing separator patterns (`|---`)
- Regular data rows like `| Quantitative | Numbers | Age |` are not processed
- The regex `|\s+|` (pipe-space-pipe) doesn't match the actual pattern `| |` (empty cells)

### Solution

Rewrite the `fixMarkdownTables` function with a more robust approach:

1. **Detect collapsed tables** - Look for patterns that indicate a single-line table (multiple consecutive `| |` patterns or many pipes on one line)

2. **Reconstruct table structure** - Split by the separator row (`|---|`) and then split each part into proper rows

3. **Handle edge cases**:
   - Tables with empty cells (`| |`)
   - Multi-column separators (`|---|---|`)
   - Tables embedded in other content

The new logic will:
- Find the separator pattern (`|---...|`)
- Extract the header (content before separator)
- Extract the body (content after separator)
- Split body rows when we detect `| |` followed by content starting with `| `
- Rejoin with proper newlines

---

## Issue 2: Input Bar Jumps to Top During AI Response

**What's happening:**
When the AI starts generating a response, the input bar (which should stay fixed at the bottom) briefly appears at the top of the screen, then returns to its proper position once the response completes.

**Root cause analysis:**
Looking at the layout structure:

```text
<main className="flex flex-col h-full overflow-hidden">
  <!-- Messages area - flex-1 to take available space -->
  <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
    ...messages...
  </div>
  
  <!-- Input area - shrink-0 to stay in place -->
  <div className="shrink-0 border-t ...">
    ...input form...
  </div>
</main>
```

The issue is that when streaming starts:
1. The message container's content suddenly changes (loading state or new streaming message appears)
2. The flex layout recalculates before the content renders
3. For a brief moment, the message area has minimal height
4. The input bar shifts up because there's nothing to push it down
5. Once content renders, the input returns to correct position

### Solution

Apply two CSS fixes to ensure the input bar stays anchored:

1. **Add minimum height to messages area**
   Change from `minHeight: 0` to CSS that ensures messages always take remaining space:
   ```css
   flex: 1 1 auto;
   min-height: 0;
   height: 0; /* This forces the flex item to shrink to fit, not grow beyond */
   ```

2. **Use `position: sticky` for input bar**
   Make the input bar sticky to the bottom instead of relying on flex:
   ```css
   position: sticky;
   bottom: 0;
   ```

3. **Prevent layout shift during streaming**
   Add a placeholder/minimum height when loading starts so the layout doesn't collapse:
   - The loading indicator already exists but appears after layout shift
   - Add a CSS transition or reserve space immediately

The most reliable fix is to ensure the outer container uses proper CSS flexbox constraints so children can't collapse:

```text
main: h-full flex flex-col
  messages: flex-1 overflow-auto (needs 'flex: 1 1 0' not 'flex: 1 1 auto')
  input: shrink-0 (already correct)
```

The key insight: `flex-1` in Tailwind is `flex: 1 1 0%` which should work, but the `style={{ minHeight: 0 }}` may be conflicting. We should use Tailwind's `min-h-0` class instead.

---

## Implementation Steps

### Step 1: Fix Table Rendering

**File: `src/lib/utils.ts`**

Replace the `fixMarkdownTables` function with a more robust version that:
- Detects when table rows are collapsed onto a single line
- Properly splits by the separator row pattern
- Reconstructs the table with correct newlines

### Step 2: Fix Input Bar Position

**File: `src/components/professor-ai/ProfessorChat.tsx`**

1. Remove inline `style={{ minHeight: 0 }}` and use Tailwind class
2. Ensure the messages container uses `flex-1 min-h-0` 
3. Add `overflow-hidden` to the main container to prevent layout overflow
4. Consider adding `flex-grow-0` to the input area as extra insurance

**File: `src/App.css`** (optional)

Add a CSS rule to ensure the professor chat scroll area has stable dimensions:
```css
.professor-chat-scroll-area {
  flex: 1 1 0%;
  min-height: 0;
}
```

---

## Files to be Modified

| File | Change |
|------|--------|
| `src/lib/utils.ts` | Rewrite `fixMarkdownTables` function with better row detection |
| `src/components/professor-ai/ProfessorChat.tsx` | Fix flexbox layout to prevent input bar jumping |

---

## Technical Details

### Table Fix Algorithm

```text
Input: "| Col1 | Col2 | | | |---| | A | B | | C | D |"

1. Find separator: "|---|"
2. Split: 
   - Before: "| Col1 | Col2 | | " 
   - After: " | A | B | | C | D |"
3. For "after" part, split on pattern "| |" followed by non-empty cell
4. Result:
   | Col1 | Col2 |
   |------|------|
   | A | B |
   | C | D |
```

### Layout Fix

Current problematic pattern:
```jsx
<div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
```

Fixed pattern:
```jsx
<div className="flex-1 min-h-0 overflow-y-auto">
```

The inline style may have specificity issues or timing problems with React's rendering. Using purely Tailwind classes is more predictable.

