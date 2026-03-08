

# Fix Mobile UX Issues: Header Unreachable and Chatbar Jumping

## Root Cause

The layout uses `h-screen` (`100vh`) which on mobile browsers includes the area behind the URL bar and navigation chrome. This causes:
1. The header to be pushed above the visible viewport (unreachable/unclickable)
2. The input bar to jump when the virtual keyboard opens/closes because `100vh` doesn't dynamically adjust

## Changes

### 1. Replace `h-screen` with `h-dvh` everywhere on the professor route

**Files**: `src/pages/ProfessorAI.tsx`

- Line 278, 291, 305, 318: Change all `h-screen` to `h-dvh` (Tailwind's dynamic viewport height unit, which adjusts for mobile browser chrome and keyboard)

### 2. Add viewport meta for keyboard behavior

**File**: `index.html`

- Update the viewport meta tag to include `interactive-widget=resizes-content`. This tells the browser to resize the layout content (not just the visual viewport) when the virtual keyboard appears, preventing the chatbar from jumping.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content" />
```

### 3. Fix the chat container to use `dvh`-based height

**File**: `src/components/professor-ai/ProfessorChat.tsx`

- Line 277 and 491: Replace `h-full` on the `<main>` elements with explicit height constraints. Since the parent already uses `dvh`, `h-full` should inherit correctly — but we need to ensure `overflow-hidden` is set on the outer container so the header never scrolls out of view.

### 4. Add mobile-safe CSS fallback

**File**: `src/App.css`

- Add a fallback for browsers that don't support `dvh`:
```css
@supports not (height: 100dvh) {
  .h-dvh {
    height: 100vh;
    height: -webkit-fill-available;
  }
}
```

## Summary of Fixes
- `h-screen` → `h-dvh` on all professor page containers (4 instances)
- `interactive-widget=resizes-content` on viewport meta tag
- CSS fallback for older browsers

These three changes together ensure: the header stays pinned and clickable, the input bar doesn't jump when the keyboard appears, and the layout correctly fills only the visible viewport on mobile.

