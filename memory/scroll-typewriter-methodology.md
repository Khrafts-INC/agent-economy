# Scroll-Driven Typewriter Section Methodology

**Project:** NYD Landing Page  
**Date:** 2026-02-02  
**PR:** https://github.com/Khrafts-INC/nyd-landing/pull/4

## The Goal
Create sections where:
1. Content stays vertically centered in viewport while scrolling through the section
2. Text reveals word-by-word as user scrolls
3. Blinking cursor follows the last revealed word
4. Punch line gets "breathing room" to land before section scrolls away

## Key Architecture

### HTML Structure
```
section (height: 200-300vh)          ← scroll room
  └─ stickyContent (sticky, top:0, h:100vh, flex center)
       └─ textContainer (max-width, centered)
            └─ paragraphs → word spans
```

### Critical CSS

```css
.section {
  position: relative;
  height: 250vh;  /* Creates scroll room */
}

.stickyContent {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.textContainer {
  max-width: 680px;
  text-align: center;
}

.word {
  opacity: 0;
  filter: blur(4px);
  transition: opacity 0.15s, filter 0.15s;
}

.word.revealed {
  opacity: 1;
  filter: blur(0);
}
```

### ⚠️ CRITICAL: overflow-x on html/body

**NEVER use `overflow-x: hidden` on html/body** — it creates a scroll container that breaks `position: sticky`.

**Use instead:** `overflow-x: clip` — clips content without creating scroll container.

```css
html, body {
  overflow-x: clip;  /* NOT hidden! */
}
```

## Scroll Progress Calculation

```typescript
const handleScroll = () => {
  const rect = section.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  
  // Start when section top reaches 80% of viewport
  const startPoint = viewportHeight * 0.8
  // End when section is mostly scrolled through
  const endPoint = -(sectionHeight - viewportHeight * 0.5)
  
  const scrollRange = startPoint - endPoint
  const currentPosition = startPoint - rect.top
  
  const rawProgress = currentPosition / scrollRange
  // Scale so words complete at 70% (30% breathing room)
  const scaledProgress = rawProgress / 0.7
  const progress = Math.max(0, Math.min(1, scaledProgress))
  
  const wordCount = Math.floor(progress * totalWords)
}
```

## Props

| Prop | Default | Description |
|------|---------|-------------|
| `sectionHeightVh` | 220 | Section height in vh (more = slower reveal) |
| `revealCompleteAt` | 0.7 | Progress at which all words revealed (0.7 = 70%) |
| `paragraphs` | required | Array of `{ text, className? }` |
| `className` | '' | Class for section element |
| `contentClassName` | '' | Class for text container |

## Decorative Elements

Add radial glows with `position: fixed` centered behind content:

```css
.section::before {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}
```

## Debugging Sticky Issues

If sticky isn't working:
1. Check ancestors for `overflow: hidden/scroll/auto` — any of these creates scroll container
2. Check `overflow-x: hidden` on html/body — change to `clip`
3. Verify section has explicit height greater than sticky element
4. Use browser DevTools to inspect computed `position` value

## Lessons Learned

1. **Framer Motion complexity not needed** — vanilla scroll listener works fine
2. **overflow-x: hidden is the enemy** — spent hours debugging this
3. **Test with Playwright screenshots** — invaluable for headless debugging
4. **Breathing room matters** — punch lines need time to land
