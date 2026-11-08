/**
 * Central site settings. Change the name, contact details or menu links
 * here and every page picks it up automatically.
 *
 * NOTE: Contact details and social links below are placeholders.
 */
export const siteConfig = {
  name: "Shamim's English",
  teacherName: "Shamim Sir (CU)",
  description:
    "HSC and university admission English, made simple. Learn from Shamim Sir with structured courses, books and exam-focused practice.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contact: {
    phone: "+880 1700-000000",
    email: "hello@shamimsenglish.com",
    address: "Chattogram, Bangladesh",
    hours: "Sat–Thu, 10:00 AM – 8:00 PM",
  },
  social: {
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    instagram: "https://instagram.com/",
    whatsapp: "https://wa.me/8801700000000",
    telegram: "https://t.me/",
  },
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
      { title: "Success Stories", href: "/#stories" },
      { title: "FAQ", href: "/#faq" },
      { title: "Login", href: "/login" },
    ],
  },
];
