import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Target } from "lucide-react";
import { courseCategories, type Course, type CourseCategoryId } from "@/data/courses";
import { Section } from "@/components/layout/section";
import { cn } from "@/lib/utils";

const categoryIcons: Record<CourseCategoryId, typeof BookOpen> = {
  "hsc-1st": BookOpen,
  "hsc-2nd": GraduationCap,
  admission: Target,
};

export function CourseCategories({ courses }: { courses: Course[] }) {
  return (
    <Section
      id="categories"
      eyebrow="Choose your path"
      title="Courses for every stage"
      description="Pick the program that matches your class and goal. Every course is built around the latest syllabus and exam pattern."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courseCategories.map((category) => {
          const Icon = categoryIcons[category.id];
          return (
            <Link
              key={category.id}
              href={`/#courses-${category.id}`}
              className="group relative flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 sm:p-7"
            >
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl",
                  category.tone
                )}
              >
                <Icon className="size-7" aria-hidden />
              </span>
              <h3 className="mt-5 text-h3">{category.title}</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {category.banglaTitle}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {category.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {courses.filter((c) => c.category === category.id).length} courses
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
