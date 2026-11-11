"use client";

import { useEffect, useState } from "react";
import { courseCategories, type Course, type CourseCategoryId } from "@/data/courses";
import { Section } from "@/components/layout/section";
import { cn } from "@/lib/utils";
import { CourseCard } from "./course-card";

type Filter = "all" | CourseCategoryId;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All Courses" },
  ...courseCategories.map((c) => ({ id: c.id, label: c.title })),
];

/** Reads a category from the URL hash, e.g. "#courses-hsc-1st" -> "hsc-1st". */
function filterFromHash(hash: string): Filter | null {
  const id = hash.replace(/^#courses-?/, "");
  return courseCategories.some((c) => c.id === id) ? (id as CourseCategoryId) : null;
}

export function PopularCourses({ courses }: { courses: Course[] }) {
  const [active, setActive] = useState<Filter>("all");

  // Category cards link to "#courses-<id>": switch the filter when that happens.
  useEffect(() => {
    const sync = () => {
      const fromHash = filterFromHash(window.location.hash);
      if (fromHash) setActive(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const visible =
    active === "all" ? courses : courses.filter((c) => c.category === active);

  return (
    <Section
      id="courses"
      className="relative bg-muted/40"
      eyebrow="Popular courses"
      title="Start learning today"
      description="Our most loved courses, chosen by 1,500+ students across Bangladesh."
    >
      {/* Scroll targets for the category links */}
      {courseCategories.map((c) => (
        <span key={c.id} id={`courses-${c.id}`} className="absolute top-0 scroll-mt-16" aria-hidden />
      ))}

      {/* Category filter */}
      <div
        role="tablist"
        aria-label="Filter courses by category"
        className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:justify-center sm:px-0"
      >
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={active === filter.id}
            onClick={() => setActive(filter.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === filter.id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </Section>
  );
}
