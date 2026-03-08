

# Fix Malformed Table Rendering

## Problem

The AI backend sometimes produces tables with mismatched separator rows, e.g.:

```
| Col A | Col B | Col C |
|---|---|
| val | val | val |
```

`remark-gfm` requires the separator row to have the **same number of columns** as the header. When it doesn't match, the entire block renders as plain text with visible `|` characters.

## Solution

Add a **pre-processing function** that repairs the markdown string before passing it to `ReactMarkdown`. This function will:

1. Detect lines that look like table rows (start with `|`)
2. For each table block (consecutive `|`-prefixed lines), count the max columns from data rows
3. If the separator row (`|---|...`) has fewer columns, pad it to match
4. If the separator row is missing entirely (consecutive `|`-rows with no `|---|` line), insert one after the first row

This runs as a simple string transform on `message.content` before it hits `ReactMarkdown`, keeping the unified pipeline intact.

## File Changes

**`src/components/professor-ai/ProfessorMessage.tsx`**

- Add a `fixMalformedTables(markdown: string): string` function at module level
- Call it inside the component: `<ReactMarkdown ...>{fixMalformedTables(message.content)}</ReactMarkdown>`

The function handles these cases:
- Separator has fewer `---` cells than data columns → pad with extra `---` cells
- No separator row between header and data → insert one
- Already valid tables → pass through unchanged

