# Design System — International Paper Brand Palette

This document is the single source of truth for brand colors in **flow-training**, extracted from the Radix Onsite Dune Certification workshop materials. Use it when choosing colors, theming Aura components, or reviewing UI against brand guidelines.

**Source of truth (color sheet):** [references/brand/Radix Onsite Dune Certification Workshop Day 1.png](../references/brand/Radix%20Onsite%20Dune%20Certification%20Workshop%20Day%201.png)

**Supporting brand assets:**

| Asset | Path |
|-------|------|
| Logo (workshop) | [references/brand/International Paper Logo Workshop Day 1.png](../references/brand/International%20Paper%20Logo%20Workshop%20Day%201.png) |
| Logo (symbol + wordmark) | [references/brand/International Paper logo and symbol, meaning, history, PNG.png](../references/brand/International%20Paper%20logo%20and%20symbol,%20meaning,%20history,%20PNG.png) |

---

## Priority model

On the certification color sheet, **block size indicates priority**: larger areas mean higher prominence in the UI. Colors are grouped into four tiers below. Tier 1–2 greens dominate brand identity; Tier 3 accents are used sparingly; Tier 4 neutrals carry layout and typography.

---

## Color palette by tier

### Tier 1 — Primary (largest block)

Dominant brand color. Use for primary actions, key headers, topbar accents, and primary brand surfaces.

| Name | Pantone | CMYK | RGB | HEX |
|------|---------|------|-----|-----|
| **International Paper Green** | 4165 | 82 / 18 / 50 / 38 | 0, 105, 99 | `#006963` |

### Tier 2 — Secondary (large block)

Strong supporting green. Use for secondary CTAs, success states, positive emphasis, and charts where a second green is needed.

| Name | Pantone | CMYK | RGB | HEX |
|------|---------|------|-----|-----|
| **Clover Green** | 7480 | 78 / 0 / 80 / 0 | 0, 171, 95 | `#00AB5F` |

### Tier 3 — Supporting accents (medium blocks)

Use for status, data visualization, highlights, and tertiary emphasis — not as page-wide backgrounds.

| Name | Pantone | CMYK | RGB | HEX |
|------|---------|------|-----|-----|
| **Brown** | 7519 | 41 / 54 / 65 / 50 | 98, 76, 59 | `#624C3B` |
| **Amber / Yellow** | 1365 | 0 / 28 / 79 / 0 | 252, 189, 68 | `#FCBD44` |
| **Near-Black** | 426 | 81 / 67 / 55 / 83 | 21, 25, 30 | `#15191E` |
| **Sky Blue** | 2226 | 59 / 0 / 12 / 0 | 97, 196, 219 | `#61C4DB` |
| **Sage Green** | 2267 | 36 / 0 / 49 / 0 | 174, 212, 154 | `#AED49A` |

### Tier 4 — Neutrals (smallest blocks)

Foundation for surfaces, cards, and subtle backgrounds.

| Name | Pantone | CMYK | RGB | HEX |
|------|---------|------|-----|-----|
| **Light Gray** | — | 5 / 3 / 0 / 0 | 241, 243, 245 | `#F1F3F5` |
| **White** | — | 0 / 0 / 0 / 0 | 255, 255, 255 | `#FFFFFF` |

---

## Semantic role mapping

Map brand HEX values to UI roles. When implementing in code, prefer **Aura semantic tokens** (or a theme layer) that reference these values — do not scatter raw hex in components.

| Semantic role | Brand color | HEX | Tier |
|---------------|-------------|-----|------|
| Primary / brand / key actions / headers | International Paper Green | `#006963` | 1 |
| Secondary / success / positive emphasis | Clover Green | `#00AB5F` | 2 |
| Info / data viz accent | Sky Blue | `#61C4DB` | 3 |
| Warning / highlight | Amber / Yellow | `#FCBD44` | 3 |
| Tertiary / earthy accent | Brown | `#624C3B` | 3 |
| Light positive / chart fill | Sage Green | `#AED49A` | 3 |
| Text / dark surfaces | Near-Black | `#15191E` | 3 |
| App background / subtle surface | Light Gray | `#F1F3F5` | 4 |
| Base surface / cards | White | `#FFFFFF` | 4 |

### Suggested token names (implementation)

When wiring a theme or CSS variables, use stable names that decouple components from HEX:

```css
/* Example — map to Aura/theme layer, not inline in components */
--brand-primary: #006963;
--brand-secondary: #00AB5F;
--brand-info: #61C4DB;
--brand-warning: #FCBD44;
--brand-accent-earth: #624C3B;
--brand-accent-light: #AED49A;
--brand-text: #15191E;
--brand-surface-subtle: #F1F3F5;
--brand-surface-base: #FFFFFF;
```

---

## Usage guidance (Aura-aligned)

Follow [.agents/skills/design/SKILL.md](../.agents/skills/design/SKILL.md) when building UI:

1. **Prefer Aura primitives** (`@cognite/aura/components`) before custom markup or one-off Tailwind color classes.
2. **Use semantic tokens**, not raw values in components. This document defines the brand reference; the app theme should expose tokens such as `primary`, `secondary`, `surface`, `text`.
3. **Reserve Tier 1–2 greens** for primary brand moments: main CTAs, navigation emphasis, success, and key metrics. Avoid filling entire pages with saturated green.
4. **Use Tier 3 sparingly** for accents: badges, chart series, alerts, and highlights. Do not compete with Tier 1 green on the same screen region.
5. **Use Tier 4 for layout**: page background (`#F1F3F5`), cards and panels (`#FFFFFF`), body text on light surfaces (`#15191E`).
6. **Logo usage**: Teal in logo assets aligns with International Paper Green (`#006963` / close variant `#006865` in pattern assets). Keep logo on white or light gray; avoid placing the full-color mark on busy saturated backgrounds.

### Do / don't

| Do | Don't |
|----|-------|
| Map HEX once in theme/tokens | Hardcode `#006963` in every component |
| Use Clover Green for secondary/success | Use Clover Green as the only green for primary CTAs |
| Use Near-Black for body text on light surfaces | Use Brown for long paragraphs (low contrast risk) |
| Use Amber for warnings and highlights | Use Amber for large text blocks |
| Check contrast before shipping | Assume all greens pass WCAG for small text on white |

---

## Accessibility

Minimum contrast targets: **WCAG 2.1 AA** (4.5:1 normal text, 3:1 large text / UI components).

### Recommended pairings

| Background | Foreground | Notes |
|------------|------------|-------|
| `#006963` | `#FFFFFF` | Primary buttons, headers — preferred |
| `#15191E` | `#FFFFFF` | Dark bars, inverse surfaces |
| `#624C3B` | `#FFFFFF` | Accent blocks only; verify contrast for small text |
| `#FCBD44` | `#15191E` | Warning/highlight strips |
| `#61C4DB` | `#15191E` | Info callouts |
| `#AED49A` | `#15191E` | Light accent panels |
| `#F1F3F5` | `#15191E` | Default app background + body text |
| `#FFFFFF` | `#15191E` | Cards and forms |

### Caution

- **`#00AB5F` (Clover Green) on `#FFFFFF`:** Vivid green may fail contrast for **small** text. Safe for icons, large headings, borders, and fills; for small labels use Near-Black text or a darker green variant derived from Tier 1.
- **`#AED49A` and `#61C4DB`:** Fine for backgrounds and decorative fills; avoid small light-gray text on these alone.
- **Never rely on color alone** for state (success/error/warning). Pair with text, icons, or `Badge`/`Alert` labels per Aura patterns.

---

## Quick reference (HEX only)

| Priority | Name | HEX |
|----------|------|-----|
| 1 | International Paper Green | `#006963` |
| 2 | Clover Green | `#00AB5F` |
| 3 | Brown | `#624C3B` |
| 3 | Amber / Yellow | `#FCBD44` |
| 3 | Near-Black | `#15191E` |
| 3 | Sky Blue | `#61C4DB` |
| 3 | Sage Green | `#AED49A` |
| 4 | Light Gray | `#F1F3F5` |
| 4 | White | `#FFFFFF` |

---

## Related documentation

- Aura design skill: [.agents/skills/design/SKILL.md](../.agents/skills/design/SKILL.md)
- Primitive selection: [.agents/skills/design/primitive-usage.md](../.agents/skills/design/primitive-usage.md)
- Product spec: [SPEC.md](../SPEC.md)