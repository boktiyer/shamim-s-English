/**
 * Dummy course data for the homepage.
 * Later this will come from Supabase instead.
 */

export type CourseCategoryId = "hsc-1st" | "hsc-2nd" | "admission";

export type CourseCategory = {
  id: CourseCategoryId;
  title: string;
  banglaTitle: string;
  description: string;
  /** Tailwind classes for the category's accent color */
  tone: string;
};

export type Course = {
  id: string;
  title: string;
  category: CourseCategoryId;
  lessons: number;
  durationWeeks: number;
  students: number;
  rating: number;
  price: number;
  originalPrice?: number;
  /** Put a real image in /public/images and set the path, e.g. "/images/course-1.jpg" */
  image?: string;
  tag?: "Bestseller" | "New" | "Live";
};

export const courseCategories: CourseCategory[] = [
  {
    id: "hsc-1st",
    title: "HSC 1st Year",
    banglaTitle: "এইচএসসি ১ম বর্ষ",
    description:
      "Build a strong foundation in grammar, reading and writing for English 1st & 2nd Paper.",
    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    id: "hsc-2nd",
    title: "HSC 2nd Year",
    banglaTitle: "এইচএসসি ২য় বর্ষ",
    description:
      "Complete syllabus revision, board question solving and model tests for GPA 5.",
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "admission",
    title: "Admission Batch",
    banglaTitle: "ভর্তি প্রস্তুতি",
    description:
      "Targeted English preparation for DU, CU, RU, JU, GST and medical admission tests.",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
];

export const courses: Course[] = [
  {
    id: "hsc1-grammar-foundation",
    title: "English Grammar Foundation",
    category: "hsc-1st",
    lessons: 48,
    durationWeeks: 16,
    students: 3200,
    rating: 4.9,
    price: 1500,
    originalPrice: 2500,
    tag: "Bestseller",
  },
  {
    id: "hsc1-writing-mastery",
    title: "Writing Mastery: Paragraph to Composition",
    category: "hsc-1st",
    lessons: 30,
    durationWeeks: 10,
    students: 1850,
    rating: 4.8,
    price: 1200,
    originalPrice: 1800,
  },
  {
    id: "hsc2-full-revision",
    title: "HSC Final Revision Batch",
    category: "hsc-2nd",
    lessons: 60,
    durationWeeks: 20,
    students: 4100,
    rating: 4.9,
    price: 2500,
    originalPrice: 4000,
    tag: "Live",
  },
  {
    id: "hsc2-model-tests",
    title: "Board Question Solve & Model Tests",
    category: "hsc-2nd",
    lessons: 36,
    durationWeeks: 8,
    students: 2750,
    rating: 4.8,
    price: 999,
    originalPrice: 1500,
  },
  {
    id: "admission-varsity-english",
    title: "Varsity Admission English",
    category: "admission",
    lessons: 55,
    durationWeeks: 14,
    students: 3600,
    rating: 4.9,
    price: 3000,
    originalPrice: 4500,
    tag: "Bestseller",
  },
  {
    id: "admission-vocab-booster",
    title: "Vocabulary & Synonym Booster",
    category: "admission",
    lessons: 25,
    durationWeeks: 6,
    students: 1400,
    rating: 4.7,
    price: 799,
    tag: "New",
  },
];

export function getCategory(id: CourseCategoryId) {
  return courseCategories.find((c) => c.id === id)!;
}

export function countCoursesIn(id: CourseCategoryId) {
  return courses.filter((c) => c.category === id).length;
}
