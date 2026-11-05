import { describe, expect, it } from "vitest";
import { THEME_IDS, THEMES } from "./themes";

// WCAG relative luminance of a #RRGGBB colour
function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light = 0, dark = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("theme accents (T-603)", () => {
  it.each(THEME_IDS)("%s is readable under white text and as text on the page", (id) => {
    const { accent, background } = THEMES[id].colors;
    expect(contrast(accent, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent, background)).toBeGreaterThanOrEqual(4.5);
  });
});
