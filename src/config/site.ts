/**
 * Central site settings. Change the name, contact details or menu links
 * here and every page picks it up automatically.
 *
 */
export const siteConfig = {
  name: "Shamim's English",
  teacherName: "Shamim Sir (CU)",
  description:
    "HSC and university admission English, made simple. Learn from Shamim Sir with structured courses, books and exam-focused practice.",
  /** Public address. Set NEXT_PUBLIC_SITE_URL (e.g. https://shamimsenglish.com); on Vercel it falls back to the production domain. */
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  ).replace(/\/+$/, ""),
  contact: {
    phone: "01713-620014",
    /** Leave empty to hide the line in the footer */
    email: "",
    address: "Lokman Tower (3rd Floor), Lal Chand Road, Gulzar Circle, Chawkbazar, Chittagong",
    hours: "",
  },
  /** Leave a link empty ("") to hide it. */
  social: {
    facebook: "",
    youtube: "https://www.youtube.com/@mmhshamimsir",
    instagram: "",
    whatsapp: "",
    telegram: "",
  } as Record<"facebook" | "youtube" | "instagram" | "whatsapp" | "telegram", string>,
} as const;

export type NavItem = {
  title: string;
  href: string;
};

/** Links shown in the header (desktop + mobile menu). */
export const mainNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Courses", href: "/#courses" },
  { title: "Books", href: "/#books" },
  { title: "About Teacher", href: "/#about" },
  { title: "Contact", href: "/#contact" },
];

export const authNav = {
  login: { title: "Login", href: "/login" },
  register: { title: "Register", href: "/register" },
} as const;

/** Grouped links shown in the footer. */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Courses",
    items: [
      { title: "HSC 1st Year", href: "/#courses" },
      { title: "HSC 2nd Year", href: "/#courses" },
      { title: "Admission Batch", href: "/#courses" },
      { title: "Books", href: "/#books" },
    ],
  },
  {
    title: "Quick Links",
    items: [
      { title: "About Teacher", href: "/#about" },
      { title: "Student Achievements", href: "/#achievements" },
      { title: "Success Stories", href: "/#stories" },
      { title: "FAQ", href: "/#faq" },
      { title: "Login", href: "/login" },
    ],
  },
];
