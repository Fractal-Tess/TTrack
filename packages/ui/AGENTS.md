# TTrack UI Package Knowledge Base

**Generated:** 2026-01-17
**Package:** @workspace/ui | **Components:** 54 React components

## OVERVIEW

Shared React UI library with Data Terminal Industrial theme, TailwindCSS v4, shadcn/ui patterns.

## STRUCTURE

```
packages/ui/
├── src/components/     # 54 components (button, card, chart, select...)
├── src/lib/utils.ts    # cn() utility (clsx + tailwind-merge)
├── src/styles/         # globals.css (TailwindCSS v4 + oklch theme)
├── components.json     # shadcn registry config
└── package.json        # exports: ./components, ./lib
```

## WHERE TO LOOK

| Component | Path                        | Purpose                              |
| --------- | --------------------------- | ------------------------------------ |
| Button    | `src/components/button.tsx` | CVA variants, data-slot/variant/size |
| Card      | `src/components/card.tsx`   | Compound exports (Header, Title...)  |
| Chart     | `src/components/chart.tsx`  | Recharts wrapper, ChartConfig        |
| Select    | `src/components/select.tsx` | Radix compound component             |

## CONVENTIONS

**Imports:** `import { cn } from "@workspace/ui/lib/utils"`

**CVA Pattern:**

```typescript
const variants = cva("base", {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: "default", size: "default" }
})
```

**Data Attributes:** `data-slot`, `data-variant`, `data-size`

**Compound Exports:** `export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction }`

## UNIQUE STYLES

**TailwindCSS v4:** `@theme inline` maps CSS vars → utilities. Oklch colors: `oklch(0.6 0.2 200)`. Dark mode: `.dark` class.

**Styling:** All use `cn()`. `rounded-none` (industrial look). Parent selectors: `group-data-[size=sm]/card:px-3`.

**Chart Colors:** `--chart-1`: cyan, `--chart-2`: purple, `--chart-3`: amber, `--chart-4`: teal.

**Radix:** Slot for polymorphic components (`asChild`). Dialog, Popover, Select, Tooltip wrap Radix primitives.
