/**
 * Design tokens extracted from the design prototype (the_goal.html).
 *
 * These mirror the look-and-feel the staff signed off on. They exist as a
 * typed reference for the upcoming UI-conversion phase; prefer wiring these
 * into the shadcn CSS variables in `src/App.css` over hard-coding hex values
 * in components (CLAUDE.md §5).
 */

export const brand = {
  name: "ماسة فاشن",
  /** Primary accent used across buttons, active nav, focus rings. Kept as a raw
   *  hex because {@link tint} mixes it with white; theme-aware accent surfaces
   *  should use the `--accent-soft` / `--accent-line` tokens instead. */
  accent: "#2B50D6",
  /** Accent-on-tint text/border color. Theme-aware: the prototype's exact
   *  darkened brand in light, a lightened brand in dark (see `--publish-fg`). */
  accentDark: "var(--publish-fg)",
  currency: "د.أ",
} as const;

/**
 * Mix a hex color with white — the prototype's `color-mix(... p%, #fff)` tint
 * used for swatch gradients and accent-tinted surfaces. Kept here so the exact
 * formula lives in one place instead of being re-typed across components.
 */
export function tint(hex: string, percent: number): string {
  return `color-mix(in srgb, ${hex} ${percent}%, #fff)`;
}

/**
 * Surface / text palette from the prototype, routed through the theme-aware
 * CSS variables defined in `src/App.css`. The light values of those tokens
 * equal the prototype hexes exactly (light mode is unchanged); the `.dark`
 * block re-tunes them, so every consumer adapts with no per-component work.
 */
export const palette = {
  appBg: "var(--app-bg)",
  reviewBarBg: "var(--review-bar)",
  sidebarBg: "var(--sidebar-bg)",
  cardBg: "var(--card)",
  cardBorder: "var(--line)",
  textStrong: "var(--ink)",
  textMuted: "var(--ink-muted)",
  textFaint: "var(--ink-faint)",
  inputBorder: "var(--line-2)",
} as const;

/** Semantic colors for stock badges, keyed by availability (theme-aware). */
export const statusColors = {
  in: {
    fg: "var(--ok-fg)",
    bg: "var(--ok-bg)",
    border: "var(--ok-line)",
    dot: "var(--ok-dot)",
  },
  out: {
    fg: "var(--danger-fg)",
    bg: "var(--danger-bg)",
    border: "var(--danger-line)",
    dot: "var(--danger-dot)",
  },
  soon: {
    fg: "var(--warn-fg)",
    bg: "var(--warn-bg)",
    border: "var(--warn-line)",
    dot: "var(--warn-dot)",
  },
} as const;

/** Colors for the publish-state badge. `published` is accent-tinted. */
export const publishColors = {
  published: {
    fg: "var(--publish-fg)",
    bg: "var(--publish-bg)",
    border: "var(--publish-line)",
  },
  draft: {
    fg: "var(--neutral-fg)",
    bg: "var(--neutral-bg)",
    border: "var(--neutral-line)",
  },
} as const;

export const radii = {
  control: "12px",
  card: "18px",
  pill: "20px",
} as const;
