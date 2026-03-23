

# Fix Copy Button to Output Clean Text Instead of Raw Markdown

## Problem

`handleCopy` copies `message.content` directly — the raw markdown with `**bold**`, `##` headers, `$$` LaTeX, etc. Users expect the cleaned, human-readable version.

## Solution

Add a markdown-to-plain-text converter that strips markdown syntax before copying. Use a lightweight function that:

1. Removes `**bold**` / `*italic*` markers → keeps inner text
2. Removes `##` heading markers
3. Removes `$$...$$` LaTeX delimiters (keeps the formula text)
4. Removes inline code backticks
5. Cleans up `[text](url)` links → keeps text
6. Preserves list numbering and bullet structure
7. Normalizes whitespace

**File**: `src/components/professor-ai/ProfessorMessage.tsx`

- Add a `markdownToPlainText(md: string): string` utility function at module level
- Update `handleCopy` to call `navigator.clipboard.writeText(markdownToPlainText(message.content))` instead of copying raw content

The function uses simple regex replacements — no new dependencies needed:

```typescript
function markdownToPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')           // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')        // bold
    .replace(/\*(.+?)\*/g, '$1')            // italic
    .replace(/`{3}[\s\S]*?`{3}/g, ...)      // code blocks → keep content
    .replace(/`(.+?)`/g, '$1')              // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')     // links
    .replace(/\$\$(.+?)\$\$/gs, '$1')       // block LaTeX
    .replace(/\$(.+?)\$/g, '$1')            // inline LaTeX
    .replace(/^\s*[-*+]\s/gm, '• ')         // bullets
    .replace(/\n{3,}/g, '\n\n')             // excess newlines
    .trim();
}
```

Single file change, no new dependencies.

