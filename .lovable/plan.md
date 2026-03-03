

# Recommendations for Improving the Frontend Rendering Pipeline

Your analysis is accurate. Here are concrete, prioritized improvements:

---

## 1. Eliminate Layout Shifts During Streaming (High Impact)

**Problem**: Content type detection (table, LaTeX, concept) only works when the full block arrives, causing sudden re-renders.

**Solution**: Use a single `ReactMarkdown` pass instead of splitting by `\n\n` and detecting types manually. Move LaTeX handling into remark/rehype plugins so the entire content flows through one unified pipeline.

- Replace the `renderContentWithLatex` function with a single `<ReactMarkdown>` call using custom remark plugins for LaTeX (`remark-math` + `rehype-katex`).
- This eliminates the paragraph-splitting logic, the `isTable()` regex, the `isConceptDefinition()` check, and the `processInlineMath()` function entirely.
- Tables, headings, bold text, and code blocks are all handled natively by ReactMarkdown + remark-gfm without custom detection.

**Files**: `ProfessorMessage.tsx`, remove `fixMarkdownTables` from `utils.ts`

---

## 2. Stabilize Mermaid Diagram Height (Medium Impact)

**Problem**: Placeholder is `min-h-[80px]` but rendered diagrams are much taller, causing a jump.

**Solution**: 
- Use `min-h-[200px]` for the placeholder (closer to average diagram height).
- Add a CSS `transition: height 0.2s ease` on the container so the size change is animated rather than abrupt.
- Alternatively, render Mermaid in a hidden container first to measure the height, then swap.

**File**: `MermaidDiagram.tsx`

---

## 3. Simplify the SSE Stream Processing (Medium Impact)

**Problem**: The hook manually strips multiple regex patterns (`DIAGNOSTIC_EVENT`, `EXPERTISE_LEVEL`, `SYSTEM_EVENT`, `CALIBRATION_REQUEST`) from the stream content with fragile regex. If the backend format changes slightly, the UI leaks raw data.

**Solution**: Have the backend send system events as distinct SSE event types instead of embedding them in the text content:

```
event: diagnostic
data: {"topic_slug": "...", "questions": [...]}

event: system
data: {"type": "persona_shift", "persona": "..."}

event: message
data: {"content": "visible text chunk"}
```

Then in `processSSELine`, route by event type instead of regex-stripping the accumulated string. This completely eliminates the fragile regex pipeline.

**Files**: `professor-chat/index.ts` (edge function), `useProfessorChat.ts`

---

## 4. Debounce Streaming Content Updates (Low-Medium Impact)

**Problem**: Every SSE chunk triggers `setStreamingContent()`, causing a React re-render per chunk. With the heavy rendering pipeline (LaTeX parsing, regex checks), this causes visible jank.

**Solution**: Batch updates using `requestAnimationFrame` or a 50ms debounce:

```typescript
const rafRef = useRef<number>();
const pendingContentRef = useRef("");

const updateDisplayContent = (accumulated: string) => {
  pendingContentRef.current = accumulated;
  if (!rafRef.current) {
    rafRef.current = requestAnimationFrame(() => {
      setStreamingContent(strip(pendingContentRef.current));
      rafRef.current = undefined;
    });
  }
};
```

**File**: `useProfessorChat.ts`

---

## 5. Memoize the Markdown Components Object (Low Impact)

**Problem**: `getMarkdownComponents()` creates a new object on every render, forcing ReactMarkdown to re-mount all custom components.

**Solution**: Define the components object once at module level (it has no dynamic dependencies) or wrap in `useMemo`.

**File**: `ProfessorMessage.tsx`

---

## Priority Order

| # | Recommendation | Effort | Impact |
|---|----------------|--------|--------|
| 1 | Unified ReactMarkdown + remark-math pipeline | High | Eliminates most layout shifts and ~200 lines of fragile code |
| 2 | Stabilize Mermaid placeholder height | Low | Removes diagram jump |
| 3 | Typed SSE events from backend | Medium | Eliminates regex fragility entirely |
| 4 | RAF-debounced streaming updates | Low | Smoother streaming render |
| 5 | Memoize markdown components | Trivial | Minor perf improvement |

