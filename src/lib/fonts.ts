import { Hind_Siliguri, Playfair_Display } from "next/font/google";

/*
 * Body text uses Times New Roman (a system font, so nothing to download).
 * See --font-sans in src/app/globals.css.
 */

/** Headings and bold display text — elegant serif. */
export const fontDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/** Bangla text — used automatically for Bangla characters. */
export const fontBangla = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bangla",
  display: "swap",
});
