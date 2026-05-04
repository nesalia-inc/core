# Design System

## Philosophy

A fusion of terminal aesthetics with refined luxury. Clean, precise, and intentional.

## Mode

Dark first. Supports light mode via shadcn/ui theming.

## Components

All [shadcn/ui](https://ui.shadcn.com) components with [motion](https://motion.dev) animations.

## Visual Language

### Colors
Only use CSS variables: `background`, `foreground`, `muted`, `muted-foreground`, `border`, `accent`, `destructive`, etc. No `bg-zinc`, `text-zinc`, or theme-specific utilities.

### Icons
[Lucide](https://lucide.dev) icons.

### Borders
- No rounded corners or minimal (1-2px max)
- Sharp, defined edges
- Use `divide` and border utilities to avoid double borders in nested layouts

### Shadows
None.

### Focus Ring
- `outline: 2px solid accent`
- `outline-offset: 2px`

### Spacing
- Smart margins
- Generous whitespace
- Grid-aligned

### Typography
- Font: [Geist](https://vercel.com/font) (sans-serif) + Geist Mono for monospace
- High contrast

## Animations
Use [motion](https://motion.dev) for all animations. Subtle, fast transitions (150-300ms). Avoid jarring movements.

## Responsive
Mobile-first approach. Design for small screens first, enhance for larger.

## Max Width
- Up to 27": max-width 5xl (58rem)
- 27" and above: max-width 7xl (64rem)

## Aesthetic

Terminal meets luxury. The precision of command-line interfaces with the elegance of high-end design.
