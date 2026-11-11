/**
 * Student achievement photos for the homepage.
 *
 * To add a photo:
 *  1. Put the image in public/images/achievements/ (JPG, under ~500 KB is best)
 *  2. Add an entry below. The first entry is shown large (featured).
 */
export type Achievement = {
  image: string;
  /** Main line, e.g. the student's name or result */
  title: string;
  /** Second line, e.g. exam, score and school */
  subtitle?: string;
  /** Small label on the photo, e.g. "SSC 2026" */
  tag?: string;
  /** true for designed posters that already contain text (hides the caption overlay) */
  poster?: boolean;
};

export const achievements: Achievement[] = [
  {
    image: "/images/achievements/achievement-1.jpg",
    title: "Millat — 1st in Moheshkhali Upazila",
    subtitle: "SSC 2026 · 1242 out of 1300 · Moheshkhali Island High School",
    tag: "SSC 2026",
    poster: true,
  },
  {
    image: "/images/achievements/achievement-2.jpg",
    title: "Celebrating our achiever",
    subtitle: "Shamim's English",
    tag: "Top Result",
  },
  {
    image: "/images/achievements/achievement-3.jpg",
    title: "Celebrating our achiever",
    subtitle: "Shamim's English",
    tag: "Top Result",
  },
  {
    image: "/images/achievements/achievement-4.jpg",
    title: "Student of the Year",
    subtitle: "Shamim's English Annual Award",
    tag: "Award",
  },
  {
    image: "/images/achievements/achievement-5.jpg",
    title: "Student of the Year",
    subtitle: "Shamim's English Annual Award",
    tag: "Award",
  },
];
