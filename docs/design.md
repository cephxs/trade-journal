# Design notes

Dark-first trading terminal. Tokens live in `apps/web/src/app/globals.css`; charts
resolve them at runtime (`components/charts/tokens.ts`) because ECharts paints to
canvas, where CSS variables don't reach.

## P&L color is never load-bearing

Trader convention demands green profit / red loss, and green/red is the classic
red-green colorblindness trap (validated: the pair fails CVD separation with ΔE ≈ 4,
far under the ≥ 8 target). The convention stays, so the design compensates by making
color pure reinforcement:

- Every P&L value renders as **signed text** (`+$171.00` / `−$102.50`) in ink tokens
- Bars grow from a **zero baseline**: direction is geometry
- Win/loss ship as **text chips** (`WIN` / `LOSS`), never colored dots alone
- Calendar cells print the number and trade count; the background tint scales with
  **magnitude** (lightness survives CVD), while sign lives in the printed number
- Trade markers differ by **shape and position**: entries ▲ below the bar, exits ▼
  above (Vela's native convention)

## Palette

The tokens are the fstarlabs palette (`fstarlabsBeUI-new/src/app/globals.css`):
pure-grey surfaces, `#fafafa` ink, cyan brand. fstarlabs ships dark only, so the
light theme steps the same hues in OKLCH until they pass contrast on white.
`tests/tokens.test.ts` is the gate: text roles at 4.5:1, marks at 3:1, both themes.

Categorical slots (`--series-1…8`) keep the fixed hue order blue, orange, green,
gold, pink, dark green, violet, red; where fstarlabs owns the hue the slot takes
its tool color (Po3 blue, QT green, Every Gap gold, Lathyrus violet). Both modes
were run through the dataviz palette validator (CVD separation, lightness band,
chroma floor, contrast). Light green↔orange sits in the 6–8 ΔE floor band, which
is legal only because series ship with labels and a zero baseline. Fixed assignment
order, never cycled; ≥ 4 simultaneous series fold to "Other". Sequential encodings
are single-hue lightness ramps. One value axis per pane, never dual-axis.

Everything a canvas paints reads these through `readVizTokens()`; no component
holds a hex of its own. The one exception is `review-export.tsx`: its PDF preview
is a paper document and stays white with grey ink in both themes.

## Type

The roles live in `apps/web/src/app/typography.css`, cut from the fstarlabs type
system (`fstarlabsBeUI-new/src/app/typography.css`). Geist Sans and Geist Mono load
through `next/font`; Apple devices take the system face first, as fstarlabs does.

Three rules carry over: every headline role tracks at a flat -0.06em; headlines are
500, never 600 or 700 (`tests/type.test.ts` gates it); leading inverts against size,
titles at 0.95 and body at 1.36 or more.

| Role | Use | Cut |
| --- | --- | --- |
| `type-stat` | the hero number on a KPI card | 30 / 0.95 / -0.06em / 500, tabular |
| `type-stat-sm` | a secondary number, a trade's P&L | 20 / 1.2 / -0.06em / 500, tabular |
| `type-h3-card` | section and dialog titles | 20 / 0.95 / -0.06em / 500 |
| `type-h3-sm` | panel and page titles | 16 / 0.95 / -0.06em / 500 |
| `type-h5` | the caps kicker over a card (`CardTitle`) | 10 mono / 1.2 / -0.06em / 400 |
| `type-nav` | brand label, sidebar title | 14 / 1.5 / 500 |

The two `stat` roles are dashboard additions fstarlabs never needed. Body copy keeps
Tailwind's `text-sm` and `text-xs`; fstarlabs P2 and P3 are within a pixel of them.
Small emphasis (a P&L in a list row) is `font-medium`.
