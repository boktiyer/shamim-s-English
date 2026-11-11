import { Hind_Siliguri, Inter } from "next/font/google";

/** All English text (body and headings). */
export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/** Bangla text — used automatically for Bangla characters. */
export const fontBangla = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bangla",
  display: "swap",
});
