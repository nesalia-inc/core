# Homepage Content Report - @deessejs/fp

## Overview

This document outlines the proposed content structure for the `@deessejs/fp` homepage. The homepage serves as the main entry point for the library's website, communicating value proposition, providing quick-start guidance, and showcasing the library's capabilities.

**Design System Alignment:** Vercel-like aesthetic — clean, minimalist, premium dark theme, simple gradients, sans-serif typography, code-centric presentation.

**Reference:** Inspired by Vercel, Linear, and modern developer tool landing pages.

---

## Design Tokens (Vercel-like)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#000000` | Main background (pure black) |
| `--bg-secondary` | `#0a0a0a` | Card backgrounds |
| `--bg-elevated` | `#111111` | Elevated surfaces |
| `--accent` | `#ffffff` | Primary accent (white) |
| `--accent-muted` | `#888888` | Muted accent |
| `--text-primary` | `#ffffff` | Primary text |
| `--text-secondary` | `#666666` | Secondary text |
| `--text-muted` | `#888888` | Muted text |
| `--border` | `#222222` | Borders |
| `--border-subtle` | `#1a1a1a` | Subtle borders |

### Vercel-style Gradients

```css
/* Subtle text gradient */
background: linear-gradient(180deg, #fff 0%, #888 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Card hover */
transition: background 0.2s ease;
```

Note: Vercel uses minimal gradients - mostly just white/black. For the FP library, we might use a subtle blue accent gradient on CTAs.

### Typography

- **Font Family:** DM Sans (Google Fonts import)
- **Letter Spacing:** -0.01em for headings
- **Line Height:** 135% for body text
- **Fallback:** system-ui, sans-serif

### Shadows

```css
/* Dropdown/Cards */
box-shadow: 0px 1.5px 20px 0px rgba(0, 0, 0, 0.65);
```

### Border Radius

- **Cards:** `rounded-xl` (12px)
- **Buttons:** `rounded-full` (pill shape)
- **Inputs:** `rounded-lg` (8px)

### Animations (motion/react)

- **Duration:** 0.75s for transitions, 2s for fades
- **Easing:** `ease-out` for entries
- **Pattern:** Gradient backgrounds with opacity cycling

---

## Proposed Page Sections

### 1. Hero Section

**Purpose:** Immediate impact — communicate what the library is and why it matters in 5 seconds.

**Content:**
- **Headline:** "Type-Safe Error Handling for TypeScript"
- **Subheadline:** "Result, Maybe, Try, and AsyncResult — composable types that make errors a first-class citizen."
- **Primary CTA:** "Get Started" → links to installation/quick-start
- **Secondary CTA:** "View on GitHub" → links to repository
- **Code Preview:** A concise, visually striking code snippet demonstrating the core pattern

**Visual Notes (Vercel-inspired):**
- Pure black background (`#000000`)
- Clean, centered code block with minimal border
- White CTA button (classic Vercel style)
- Gradient text accent on headline (optional)
- Subtle grid background (barely visible)
- Generous whitespace

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Logo          Nav: Docs · GitHub · Examples    │
├─────────────────────────────────────────────────┤
│                                                 │
│     [Headline - large, high contrast]          │
│     [Subheadline - muted text]                  │
│                                                 │
│     [Get Started - gradient btn]  [GitHub - outlined] │
│                                                 │
│     ┌─────────────────────────────────────┐      │
│     │  Terminal-style code block         │      │
│     │  with syntax highlighting           │      │
│     └─────────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 2. Value Proposition Section

**Purpose:** Answer "why should I use this?" for visitors who need more context.

**Content (4 key benefits in a grid):**

| Benefit | Description |
|---------|-------------|
| **Type-Safe** | Errors are encoded in the type system — the compiler forces you to handle them |
| **Composable** | Chain, map, and combine operations without nested if/else spaghetti |
| **Ergonomic** | No more undefined/null checks everywhere — methods like `.map()`, `.flatMap()`, `.unwrap()` |
| **Lightweight** | Zero dependencies, tree-shakeable, ~2KB gzipped |

**Visual Notes:**
- `rounded-lg` cards with `border border-[#222]`
- Clean background (`#0a0a0a`)
- Lucide icons for each benefit (Zap, GitMerge, Sparkles, Feather)
- Hover: subtle background shift to `#111`
- Grid: 4 columns desktop, 2 columns tablet, 1 column mobile
- Minimal, Vercel-style flat design

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  Icon   │  │  Icon   │  │  Icon   │  │  Icon   │  │
│  │ Type-   │  │ Compo-  │  │ Ergo-   │  │ Light-  │  │
│  │ Safe    │  │ nent    │  │ nomic   │  │ weight  │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### 3. Quick Start Section

**Purpose:** Get developers running in under 2 minutes.

**Content:**
- **Installation:** `pnpm add @deessejs/fp` (or npm/yarn)
- **Basic Usage Example:** Result type with success/failure flow
- **Copy button** on code blocks with checkmark feedback

**Example Code:**
```typescript
import { Result, ok, err } from '@deessejs/fp';

const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) return err(new Error('Division by zero'));
  return ok(a / b);
};

const result = divide(10, 2);
result.map(value => console.log(`Result: ${value}`));
result.mapErr(error => console.error(`Error: ${error.message}`));
```

**Visual Notes:**
- Terminal-style code block with monospace font (DM Sans Mono or JetBrains Mono)
- Dark background with border `border-[#2E3033]`
- Copy button with Lucide `Copy` icon → transitions to `Check` on success
- Animation: subtle fade-in on copy success (150-200ms)

---

### 4. Core Types Overview

**Purpose:** Show the four building blocks at a glance.

**Content (4 cards/columns):**

| Type | Purpose | Analogy |
|------|---------|---------|
| **Result** | Represents success or failure with error | `try/catch` as a type |
| **Maybe** | Represents optional values (something/nothing) | Type-safe `undefined` |
| **Try** | Lazy evaluation of code that might throw | `() => try {}` wrapped |
| **AsyncResult** | Async operations that might fail | `Promise<Result>` |

**Each card includes:**
- Type name with Lucide icon
- One-line description
- Minimal code snippet (1-3 lines)

**Visual Notes:**
- Same card styling as Value Proposition section
- Horizontal scroll on mobile (snap points)
- Grid: 4 columns desktop, 2 columns tablet, 1 column mobile

---

### 5. Code Example Showcase

**Purpose:** Demonstrate real-world usage patterns.

**Content:** Tabs to switch between 3 examples:

**Example A: Chained Operations**
```typescript
const result = await fetchUser(id)
  .andThen(validateUser)
  .andThen(checkPermissions)
  .map(user => user.name);
```

**Example B: Error Aggregation**
```typescript
const results = await Promise.all([
  fetchConfig(),
  fetchTranslations(),
  fetchTheme(),
]).mapErr(errors => new AggregateError(errors));
```

**Example C: Railway-Oriented Programming**
```typescript
validate(input)
  .pipe(validateSchema)
  .pipe(transformData)
  .pipe(saveToDatabase)
  .unwrapOr(fallback);
```

**Visual Notes:**
- Tabs with `rounded-full` styling (per supermemory header tabs pattern)
- Active tab: `bg-[#00173C]! border-[#2261CA33]!`
- Code blocks consistent with Quick Start section

---

### 6. Features Grid

**Purpose:** Comprehensive list of library capabilities.

**Content (2-column grid):**
- Fully tree-shakeable
- Zero runtime dependencies
- TypeScript-first (strict mode compatible)
- ESM + CJS exports
- Works with Zod, effect-ts, and other FP libraries
- Comprehensive test coverage
- Active maintenance

**Visual Notes:**
- 2-column grid on desktop, 1-column on mobile
- Lucide icons for each feature
- Muted text color (`#737373`)

---

### 7. Installation & Import Section

**Purpose:** Clear reference for installation.

**Content:**
- Package name: `@deessejs/fp`
- All package managers: pnpm, npm, yarn, bun
- Import patterns (named exports)

**Visual Notes:**
- Code blocks for each package manager
- Terminal aesthetic with prompt prefix (`$`)

---

### 8. Footer

**Purpose:** Navigation and links.

**Content:**
- Logo + tagline
- GitHub repository link
- npm package link
- Documentation links (API reference, guides)
- License (MIT)

**Visual Notes:**
- Border-top with `border-[#2E3033]`
- Minimal padding
- Muted text colors

---

## Landing Page Structure Insights (from supermemory.ai)

### Visual Analysis Summary

**Style:** Dark mode, premium SaaS, AI-forward
**Mood:** Smart, powerful, organized, future-forward
**Comparable to:** Linear, Vercel, Raycast

### Color Palette (Precise Hex Codes)

| Usage | Hex | Notes |
|-------|-----|-------|
| Primary background | `#0a0a0f` | Deep black/navy |
| Card surfaces | `#111115`, `#1a1a1f` | Elevated surfaces |
| Borders | `#27272a` | Zinc dark |
| Primary accent | `#3b82f6`, `#60a5fa` | Electric blue |
| Secondary accent | `#22d3ee` | Cyan/teal glow |
| Purple accent | `#8b5cf6`, `#a78bfa` | Brain interior |
| Positive/emerald | `#10b981` | Health score |
| Text primary | `#ffffff` | Headlines |
| Text muted | `#71717a`, `#a1a1aa` | Body text |
| Text very muted | `#52525b` | Footer |

### Typography Specs

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Logo | — | — | white (lowercase) |
| Hero headline | 48-56px | bold | white |
| Hero subtext | 16px | regular | `#a1a1aa` |
| Nav links | 14px | medium | white |
| Feature card titles | 16-18px | medium | white |
| Feature descriptions | 14px | regular | muted gray |
| Stats (monospace) | 14px | — | with glow |

### Navigation (Minimal Approach)

```
┌─────────────────────────────────────────────────────┐
│  Logo    Docs    GitHub    Examples    [Get Started]│
└─────────────────────────────────────────────────────┘
```

**Key insight:** No dropdown menus, no mega menus. Direct links only.

### Hero Section Elements

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────────────────┐    ┌──────────────────────┐    │
│  │  Headline           │    │                      │    │
│  │  "Your AI second    │    │    [3D Brain Device] │    │
│  │   brain"            │    │    with glow effect  │    │
│  │                     │    │                      │    │
│  │  Subtitle text      │    │    ┌─────────────┐  │    │
│  │                     │    │    │Health: 98%  │  │    │
│  │  > Command input    │    │    └─────────────┘  │    │
│  │                     │    │                      │    │
│  │  [CTA Button]       │    └──────────────────────┘    │
│  └─────────────────────┘                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key terminal element:** Command-line input with `>` prefix and monospace placeholder.

### Feature Cards

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ 🔗 Connect  │  │ 🔍 Recall   │  │ 💡 Know more│     │
│  │ everything  │  │ everything  │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Style:** Dark semi-transparent background, subtle border, soft glow on hover.

### "3 Steps" Workflow Pattern

Supermemory uses this pattern:
```
Define → Compose → Handle
```

**For @deessejs/fp:**
1. **Define** → `Result<Success, Error>` types
2. **Compose** → Chain with `.map()`, `.andThen()`
3. **Handle** → Graceful errors with `.unwrapOr()`

### Social Proof: Integration Badges

```
┌─────────────────────────────────────────┐
│  Works seamlessly with:                 │
│  [Zod] [Next.js] [tRPC] [Astro] ...     │
└─────────────────────────────────────────┘
```

### Floating Dark Card Pattern

- Dark UI card (`#0a0a0f` background)
- Subtle shadow
- Product interface preview
- Creates visual interest

**For our homepage:** Terminal-style code block floating over gradient background.

### No Pricing Section (Dev Tool Pattern)

Standard for: developer tools, open source, simple pricing.

**Recommendation:** Omit pricing from homepage for v1.

### "Vercel-like" Design Philosophy

| Aspect | Style |
|--------|-------|
| Aesthetic | Clean, minimal, premium SaaS |
| Typography | Geometric sans-serif (Space Grotesk / Inter) |
| Backgrounds | Deep blacks with subtle gradients |
| Cards | Flat with subtle borders, no heavy shadows |
| Code | Clean, syntax-highlighted, centered focus |
| Animations | Subtle, smooth, confident |
| Spacing | Generous whitespace, breathing room |

### Key Visual Elements (Vercel-inspired)

1. **Clean code block** — Syntax highlighted, centered, no terminal chrome
2. **Gradient text** — Accent gradient on key headlines
3. **Minimalist cards** — Subtle border, flat design
4. **Monospace stats** — "2KB gzipped" with clean presentation
5. **Simple grid background** — Very subtle, almost invisible
6. **Hover lift** — Cards lift slightly on hover
7. **Next.js/T3 vibe** — Modern, developer-focused, trustworthy

---

## Technical Implementation Details (from supermemory web app)

### Framework & Libraries

| Category | Technology |
|----------|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 with `@theme` directive |
| UI Components | shadcn/ui |
| Animations | `motion/react` (Framer Motion) |
| Fonts | `next/font/google` (Space Grotesk, Space Mono) |
| Theme | `next-themes` |
| State (URL) | `nuqs` for URL-driven state |

### CSS Variables (shadcn theme)

```css
/* Light mode */
:root {
  --background: oklch(0.9846 0.0017 247.8389);
  --foreground: oklch(0.2744 0.0073 285.9081);
  --primary: oklch(0.614 0.2014 258.1073);
}

/* Dark mode */
.dark {
  --background: oklch(0.1487 0.0073 258.0408);
  --foreground: oklch(0.967 0.0029 264.5419);
}
```

### Font Configuration

```tsx
// Vercel-style: Space Grotesk + Space Mono
import { Space_Grotesk, Space_Mono } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
})
```

### Typography Utility

```typescript
// Consistent typography class
export function sansClassName(additionalClasses?: string) {
  return cn(
    spaceGrotesk.className,
    "tracking-[-0.01em]",
    "leading-[135%]",
    additionalClasses,
  )
}
```

### Component Aliases (tsconfig.json)

```json
{
  "aliases": {
    "components": "@ui/components",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "utils": "@lib/utils",
    "ui": "@ui/components"
  }
}
```

### shadcn/ui Components to Use

| Component | Purpose |
|-----------|---------|
| `button` | Primary CTA, secondary buttons |
| `tabs` | Code example tabs, feature switching |
| `card` | Feature cards, code preview container |
| `dropdown-menu` | Navigation menus |
| `input` | Terminal-style command input |
| `tooltip` | Hover hints |
| `separator` | Section dividers |

### Animation Patterns (motion/react)

```tsx
import { motion, AnimatePresence } from "motion/react"

// Entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>

// Hover/tap interactions
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click me
</motion.button>

// AnimatePresence for conditional rendering
<AnimatePresence mode="wait">
  {isVisible ? (
    <motion.span key="visible" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
  ) : (
    <motion.span key="hidden" initial={{ opacity: 1 }} animate={{ opacity: 0 }} />
  )}
</AnimatePresence>
```

### Animation Timing

| Type | Duration | Easing |
|------|----------|--------|
| UI transitions | 0.2-0.3s | ease-out |
| Page transitions | 0.5-0.75s | ease-out |
| Hover effects | 0.15s | ease |

### Spacing Scale (Tailwind)

- `gap-2`, `gap-3`, `gap-4` - Grid/flex gaps
- `p-4`, `p-6` - Padding
- `rounded-lg` - Border radius (8px)
- `rounded-xl` - Border radius (12px)

### View Mode Pattern (for Tabs)

```tsx
// View mode context
const { viewMode, setViewMode } = useViewMode()

// Tabs with rounded-full styling
<TabsList className="rounded-full border border-[#161F2C]">
  <TabsTrigger
    value="grid"
    className="rounded-full data-[state=active]:bg-[#00173C]!"
  >
    <LayoutGridIcon className="size-4" />
    Grid
  </TabsTrigger>
</TabsList>
```

### Provider Structure (Root Layout)

```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  <QueryProvider>
    <AuthProvider>
      <Toaster>
        {children}
      </Toaster>
    </AuthProvider>
  </QueryProvider>
</ThemeProvider>
```

---

## Component Patterns (Vercel-like)

### Button Variants

```tsx
// Primary CTA (white, black text - Vercel style)
<Button className="bg-white text-black hover:bg-gray-200 rounded-md">
  Get Started
</Button>

// Secondary (outlined, white border)
<Button variant="outline" className="border border-[#222] hover:bg-[#111]">
  View on GitHub
</Button>

// Ghost (for nav)
<Button variant="ghost" className="text-[#666] hover:text-white hover:bg-[#111]">
  Documentation
</Button>
```

### Card Component (Vercel-like)

```tsx
// Minimal card with subtle border
<div className="border border-[#222] rounded-lg p-6 bg-[#0a0a0a]">
  {/* content */}
</div>

// Hover effect
<motion.div
  whileHover={{ backgroundColor: '#111' }}
  className="border border-[#222] rounded-lg p-6 transition-colors"
>
```

### Code Block (Vercel-style)

```tsx
// Clean, minimal code presentation
<div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-6 font-mono text-sm">
  <pre>{code}</pre>
</div>
```

### Navigation (Vercel-style)

```tsx
// Minimal top nav
<nav className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
  <Logo />
  <div className="flex items-center gap-6">
    <Link href="/docs" className="text-sm text-[#666] hover:text-white">Docs</Link>
    <Link href="/github" className="text-sm text-[#666] hover:text-white">GitHub</Link>
    <Button size="sm" className="bg-white text-black">Get Started</Button>
  </div>
</nav>
```

---

## Content Principles

1. **Clarity over cleverness** — Code examples should be immediately understandable
2. **Show, don't tell** — Let the code demonstrate value, minimize marketing fluff
3. **Vercel-like aesthetic** — Clean, minimal, premium dark theme with geometric sans-serif
4. **Mobile-first** — Design for small screens, enhance for larger
5. **Performance** — Fast load times, subtle animations (150-300ms)
6. **Minimal nav** — Only essential links, no dropdowns or mega menus
7. **Workflow clarity** — Use "3 steps" pattern to explain the developer workflow
8. **Integration trust** — Show compatibility badges with popular tools

---

## Out of Scope (for v1)

- Full documentation site (API docs, guides)
- Interactive playground/REPL
- Blog or changelog
- Comparison tables vs competitors (effect-ts, neverthrow, etc.)
- Contributing guidelines
- Pricing section (dev tool pattern - omit pricing from homepage)

---

## Next Steps

1. Validate content structure with stakeholders
2. Define exact copy for headlines and CTAs
3. Create wireframes or Figma designs
4. Choose specific Lucide icons for each section
5. Implement component by component following design system
6. Set up Space Grotesk + Space Mono fonts via next/font
7. Configure motion/react for animations
