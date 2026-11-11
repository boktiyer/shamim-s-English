import Image from "next/image";
import Link from "next/link";
import { CirclePlay, Trophy } from "lucide-react";
import type { ActiveCourse } from "@/lib/dashboard/data";
import { buttonClass } from "@/lib/button-class";
import { categoryLabels, ProgressBar } from "./ui";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  hsc_1st: "from-sky-500 to-indigo-600",
  hsc_2nd: "from-indigo-600 to-violet-700",
  admission: "from-amber-500 to-rose-600",
};

/** An enrolled course with its progress and a continue button. */
export function CourseProgressCard({ item }: { item: ActiveCourse }) {
  const { course, progress } = item;
  const done = progress.total > 0 && !progress.nextLessonId;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <Link
        href={`/dashboard/courses/${course.id}`}
        className={cn("relative block aspect-[5/2] bg-linear-to-br", tones[course.category])}
      >
        {course.thumbnail_url ? (
          <Image src={course.thumbnail_url} alt="" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
        ) : (
          <span className="absolute bottom-3 left-4 text-xs font-medium tracking-wide text-white/85 uppercase">
            {categoryLabels[course.category]}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/dashboard/courses/${course.id}`} className="font-semibold leading-snug hover:text-primary">
          {course.title}
        </Link>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {progress.completed}/{progress.total} lessons
          </span>
          <span className="font-semibold text-foreground">{progress.percent}%</span>
        </div>
        <ProgressBar percent={progress.percent} className="mt-2" />
        <div className="mt-auto pt-5">
        {done ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <Trophy className="size-4" aria-hidden /> Course completed
          </p>
        ) : progress.nextLessonId ? (
          <Link
            href={`/dashboard/learn/${progress.nextLessonId}`}
            className={buttonClass({ size: "lg", className: "w-full" })}
          >
            <CirclePlay data-icon="inline-start" aria-hidden />
            {progress.completed ? "Continue" : "Start learning"}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Lessons are coming soon.</p>
        )}
        </div>
      </div>
    </article>
  );
}
