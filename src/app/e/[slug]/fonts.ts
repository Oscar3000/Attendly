import { Montserrat, Playfair_Display } from "next/font/google";

// Fonts the theme presets use (src/lib/themes.ts), self-hosted at build time like Inter. Not
// preloaded: the browser then downloads only the ones the event's theme actually names.
// Shared by the event page and guest tickets; put the class names on the page's root element
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  preload: false,
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  preload: false,
});

export const eventFontVariables = `${playfair.variable} ${montserrat.variable}`;
