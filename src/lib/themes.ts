/**
 * Theme presets for the public event page (T-405)
 * An event stores a preset id; the page sets the preset's colours and fonts as CSS variables
 * at its root (themeStyle) and the components read var(--event-*)
 */

export const THEME_IDS = ["terracotta", "sage", "navy", "blush"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME: ThemeId = "terracotta";

export interface Theme {
  label: string;
  colors: {
    background: string;
    backgroundAlt: string;
    // Buttons, the date pill, countdown tiles: white text sits on it
    accent: string;
    // Thin lines and ornaments
    ornament: string;
    // Headings, and the dark countdown and footer bands
    ink: string;
    text: string;
    muted: string;
    border: string;
    card: string;
  };
  // CSS font-family values; web fonts come from the variables in src/app/e/[slug]/fonts.ts
  fonts: { heading: string; body: string };
}

const serif = "Georgia, 'Times New Roman', serif";
const playfair = "var(--font-playfair), Georgia, serif";
const montserrat = "var(--font-montserrat), 'Helvetica Neue', Arial, sans-serif";
const inter = "var(--font-inter), 'Helvetica Neue', Arial, sans-serif";

export const THEMES: Record<ThemeId, Theme> = {
  terracotta: {
    label: "Terracotta",
    colors: {
      background: "#FFF9F4",
      backgroundAlt: "#FDF0E6",
      accent: "#C07A54",
      ornament: "#D4AF37",
      ink: "#2C1810",
      text: "#6B4A3A",
      muted: "#9A7B6B",
      border: "#E8D5C4",
      card: "#FFFCF9",
    },
    fonts: { heading: serif, body: inter },
  },
  sage: {
    label: "Sage garden",
    colors: {
      background: "#F7FAF5",
      backgroundAlt: "#E9F0E4",
      accent: "#5E7F5E",
      ornament: "#B8A25E",
      ink: "#1F2D1F",
      text: "#41553F",
      muted: "#728A6F",
      border: "#D3DFCC",
      card: "#FBFDFA",
    },
    fonts: { heading: playfair, body: inter },
  },
  navy: {
    label: "Midnight navy",
    colors: {
      background: "#F6F8FC",
      backgroundAlt: "#E6ECF6",
      accent: "#2B4C7E",
      ornament: "#C9A227",
      ink: "#121C2E",
      text: "#3A4A63",
      muted: "#6B7A93",
      border: "#D3DCEA",
      card: "#FBFCFE",
    },
    fonts: { heading: montserrat, body: montserrat },
  },
  blush: {
    label: "Blush",
    colors: {
      background: "#FFF7F8",
      backgroundAlt: "#FBE8EC",
      accent: "#A9506A",
      ornament: "#D9A5B3",
      ink: "#3A1F2A",
      text: "#6A3F4E",
      muted: "#9C7380",
      border: "#F0D5DC",
      card: "#FFFBFC",
    },
    fonts: { heading: playfair, body: inter },
  },
};

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);

// The CSS variables for a theme, set on the event page's root element
export function themeStyle(id: ThemeId): React.CSSProperties {
  const { colors, fonts } = THEMES[id];
  return {
    "--event-bg": colors.background,
    "--event-bg-alt": colors.backgroundAlt,
    "--event-accent": colors.accent,
    "--event-ornament": colors.ornament,
    "--event-ink": colors.ink,
    "--event-text": colors.text,
    "--event-muted": colors.muted,
    "--event-border": colors.border,
    "--event-card": colors.card,
    "--event-heading-font": fonts.heading,
    "--event-body-font": fonts.body,
    backgroundColor: colors.background,
    fontFamily: fonts.body,
  } as React.CSSProperties;
}
