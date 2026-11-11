import type { CatalogCourse } from "@/lib/catalog";
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
  lessons?: number;
  durationWeeks?: number;
  students?: number;
  rating?: number;
  price: number;
  /** Where "Enroll Now" goes. Database courses use /enroll/<slug>. */
  href?: string;
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
    id: "hsc-2028-regular-batch",
    title: "HSC 2028 Regular Batch: English Preparation",
    category: "hsc-1st",
    lessons: 48,
    durationWeeks: 36,
    students: 200,
    rating: 4.9,
    price: 8000,
    originalPrice: 10000,
    // Add the poster as public/images/courses/hsc-2028-regular-batch.jpg, then uncomment:
    // image: "/images/courses/hsc-2028-regular-batch.jpg",
    tag: "Bestseller",
  },
  {
    id: "hsc1-writing-mastery",
    title: "Writing Mastery: Paragraph to Composition",
    category: "hsc-1st",
    lessons: 30,
    durationWeeks: 10,
    students: 150,
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
    students: 150,
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
    students: 150,
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
    students: 150,
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
    students: 150,
    rating: 4.7,
    price: 799,
    tag: "New",
  },
];

/** Turns a published database course into the shape the course cards use. */
export function catalogToCourse(c: CatalogCourse): Course {
  return {
    id: c.id,
    title: c.title,
    category: (c.category === "hsc_1st" ? "hsc-1st" : c.category === "hsc_2nd" ? "hsc-2nd" : "admission") as CourseCategoryId,
    durationWeeks: c.duration_weeks ?? undefined,
    price: Number(c.price),
    originalPrice: c.original_price ? Number(c.original_price) : undefined,
    image: c.thumbnail_url ?? undefined,
    tag: c.is_featured ? "Bestseller" : undefined,
    href: `/enroll/${c.slug}`,
  };
}

export function getCategory(id: CourseCategoryId) {
  return courseCategories.find((c) => c.id === id)!;
}

export function countCoursesIn(id: CourseCategoryId) {
  return courses.filter((c) => c.category === id).length;
}
