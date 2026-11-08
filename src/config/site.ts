/**
 * Central site settings. Change the name, description, or menu links
 * here and every page picks it up automatically.
 */
export const siteConfig = {
  name: "Shamim's English",
  shortName: "Shamim's English",
  description:
    "Learn English with confidence — spoken English, grammar, IELTS preparation and more, taught step by step.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export type NavItem = {
  title: string;
  href: string;
};

/** Links shown in the header (desktop + mobile menu). */
export const mainNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Courses", href: "/courses" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

/** Grouped links shown in the footer. */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { title: "All Courses", href: "/courses" },
      { title: "Spoken English", href: "/courses" },
      { title: "IELTS Preparation", href: "/courses" },
    ],
  },
  {
    title: "Company",
    items: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ],
  },
];
