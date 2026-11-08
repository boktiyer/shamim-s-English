import { Hind_Siliguri, Inter, Plus_Jakarta_Sans } from "next/font/google";

/** Body text — highly readable at small sizes. */
export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/** Headings — friendly, modern, slightly rounded. */
export const fontDisplay = Plus_Jakarta_Sans({
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
