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
  /** Primary accent used across buttons, active nav, focus rings. */
  accent: "#2B50D6",
  currency: "د.أ",
} as const;

/** Surface / text palette from the prototype. */
export const palette = {
  appBg: "#F4F5F7",
  reviewBarBg: "#0B0C0F",
  sidebarBg: "#14161B",
  cardBg: "#FFFFFF",
  cardBorder: "#ECEDF1",
  textStrong: "#14161B",
  textMuted: "#7A7F88",
  textFaint: "#9197A0",
  inputBorder: "#E2E4E9",
} as const;

/** Semantic colors for status badges, keyed by stock/publish meaning. */
export const statusColors = {
  in: { fg: "#1B7A4E", bg: "#EAF6EF", border: "#CDEBD9", dot: "#1FA463" },
  out: { fg: "#B23B3B", bg: "#FBEDED", border: "#F2D6D6", dot: "#D85656" },
  soon: { fg: "#9A6B12", bg: "#FBF4E6", border: "#F0E2C2", dot: "#E2A33A" },
} as const;

export const radii = {
  control: "12px",
  card: "18px",
  pill: "20px",
} as const;
