

# Fix Table Word-Breaking on Mobile

## Problem

On mobile, the table uses `w-full` which forces the table to fit within the screen width. With 3+ columns, cells become very narrow and words break mid-word (e.g., "Personality" → "Pers-onal-ity").

## Solution

Instead of forcing the table to `w-full`, let it use its natural width and allow horizontal scrolling. The outer `overflow-x-auto` wrapper already exists — we just need to remove `w-full` from the `<table>` element and add `min-w-max` or `whitespace-nowrap` on cells so words don't break.

### Changes in `ProfessorMessage.tsx`

1. **Table element** (line 166): Change `w-full` to `min-w-full` so the table can grow beyond the viewport width when needed
2. **Table cells** (th/td, lines 172-173): Add `whitespace-nowrap` to prevent word breaking inside cells. For `td`, use `whitespace-normal` but with `min-w-[100px]` to ensure cells have enough room for short words

Actually, the better approach: keep `whitespace-normal` (so long cell content can still wrap at word boundaries) but set a reasonable `min-w` on each cell so words like "Personality" don't get squeezed. Combined with the table being allowed to scroll horizontally.

**Final approach:**
- `<table>`: change `w-full` → `min-w-full` (allows table to exceed container width)  
- `<th>`: add `min-w-[120px]` to ensure header cells have room
- `<td>`: add `min-w-[120px]` to ensure data cells have room
- The existing `overflow-x-auto` on the wrapper handles horizontal scroll

This way, on mobile with 3+ columns the table becomes horizontally scrollable instead of crushing words.

