# Frontend Rewrite: UnoCSS → Tailwind v4 + shadcn/ui + Motion

## Goal

Rewrite `liminal-field-web` to match the reference design at `workSpace/liminal-field/app/`, migrating from UnoCSS to Tailwind CSS v4 + shadcn/ui, and adding Motion for animations.

## What to Preserve

- **API layer**: `src/services/content-items.ts`, `src/services/structure.ts` (untouched)
- **TypeScript**: keep strict TS, all types/interfaces
- **React Router**: keep client-side routing structure
- **Theme hook**: `src/hooks/use-theme.ts` (minor adjustments)
- **Admin page**: skip for now, keep route but don't rewrite

## Tech Stack Migration

| Before | After |
|--------|-------|
| UnoCSS + presetWind3 | Tailwind CSS v4 |
| Radix UI (direct) | shadcn/ui (wraps Radix) |
| No animation lib | Motion (`motion/react`) |
| 2100-line index.css | Tailwind utilities + CSS custom properties for design tokens |

## Design System (from reference)

### Design Tokens

Carried over as CSS custom properties (not Tailwind theme extensions):
- Surfaces: `--paper`, `--paper-dark`, `--shelf`, etc.
- Typography: `--ink`, `--ink-light`, `--ink-faded`, `--ink-ghost`
- Accents: monochrome (`--accent` = black/daylight, white/midnight)
- Marks: `--mark-red`, `--mark-blue`, `--mark-green`
- Shadows: `--shadow-xs/sm/md/lg`
- Structure: `--spine`, `--separator`, `--box-border`

### Typography

- Sans: Apple system fonts
- Serif: New York, Iowan Old Style, etc.
- Mono: SF Mono, Menlo

### Animations (Motion)

- Page transitions: `AnimatePresence` with fade+slide variants
- Staggered lists: `fadeUp` variants with delay
- Layout animations: `layoutId` for nav indicator
- Scroll spy: imperative scroll listener
- Spring transitions: `type: 'spring'` for nav, TOC

## Pages (4 public views)

1. **Home**: Greeting + activity list + 3-col feature cards
2. **Notes**: Article reader + TOC + AI chat FAB, immersive mode
3. **Gallery**: Polaroid display + timeline, direction-aware slides
4. **Agent**: Chat thread + hero + insights panel + related notes

## Layout Structure

```
┌─ Sidebar (200px) ─┬─ Main (flex-1, rounded card) ──────────┐
│ Title              │ ┌─ Topbar (48px) ─────────────────────┐│
│ Search (⌘K)        │ │               [GitHub] [Theme]      ││
│ Nav (4 items)      │ ├─────────────────────────────────────┤│
│ Sub-nav (context)  │ │ AnimatePresence                     ││
│                    │ │   <ViewComponent />                  ││
│ Ambient phrase     │ │                                     ││
└────────────────────┴─└─────────────────────────────────────┘│
```

## Implementation Order

1. Tech stack migration (deps, config, globals)
2. Global components (Sidebar, Topbar, Layout shell)
3. Home page
4. Notes page
5. Gallery page
6. Agent page
