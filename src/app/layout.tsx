import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontBangla, fontBody } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Shamim's English | Shamim Sir – Best HSC English Teacher in Chawkbazar, Chittagong",
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Shamim Sir (CU) – HSC English teacher in Chawkbazar, Chittagong. Shamim's English offers HSC 1st & 2nd year English, Medical & Varsity admission English courses, books and model tests.",
  keywords: [
    "Shamim",
    "Shamim Sir",
    "Shamim's English",
    "Shamims English",
    "English teacher",
    "English teacher Chawkbazar",
    "Chawkbazar English teacher",
    "Chwakbazar English teacher",
    "best English teacher Chawkbazar",
    "best English teacher Chittagong",
    "Shamim Sir HSC English",
    "HSC English",
    "HSC English teacher Chittagong",
    "admission English",
  ],
  authors: [{ name: "Shamim Sir" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    title: "Shamim's English | Shamim Sir – HSC English Teacher, Chawkbazar",
    description:
      "HSC English and Medical & Varsity admission English with Shamim Sir in Chawkbazar, Chittagong.",
    images: [{ url: "/images/shamim-sir.jpg", alt: "Shamim Sir – Shamim's English" }],
  },
  twitter: { card: "summary_large_image", images: ["/images/shamim-sir.jpg"] },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: siteConfig.name,
  alternateName: ["Shamim Sir", "Shamims English"],
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/logo.png`,
  image: `${siteConfig.url}/images/shamim-sir.jpg`,
  description: "HSC English and admission English coaching by Shamim Sir in Chawkbazar, Chittagong.",
  telephone: siteConfig.contact.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Lokman Tower (3rd Floor), Lal Chand Road, Gulzar Circle, Chawkbazar",
    addressLocality: "Chittagong",
    addressCountry: "BD",
  },
  founder: { "@type": "Person", name: "Shamim Sir", jobTitle: "English Teacher" },
};

export const viewport: Viewport = {
  themeColor: "#8c062c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn(
        fontBody.variable,
        fontBangla.variable,
        "h-full"
      )}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
