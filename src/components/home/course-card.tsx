import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import { getCategory, type Course } from "@/data/courses";
import { formatCompact, formatTaka } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/lib/button-class";
import { cn } from "@/lib/utils";

const thumbnailTones: Record<Course["category"], string> = {
  "hsc-1st": "from-sky-500 to-indigo-600",
  "hsc-2nd": "from-indigo-600 to-violet-700",
  admission: "from-amber-500 to-rose-600",
};

export function CourseCard({ course }: { course: Course }) {
  const category = getCategory(course.category);
  const discount = course.originalPrice
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      {/* Thumbnail */}
      <div
        className={cn(
          "relative overflow-hidden bg-linear-to-br",
          course.image ? "aspect-square" : "aspect-video",
          thumbnailTones[course.category]
        )}
      >
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col justify-end p-5 text-white">
            <div aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
            <div aria-hidden className="absolute top-6 right-8 size-16 rounded-full bg-white/10" />
            <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
              {category.banglaTitle}
            </p>
            <p className="mt-1 line-clamp-2 font-heading text-xl font-bold">
              {course.title}
            </p>
          </div>
        )}
        {course.tag && (
          <Badge
            className={cn(
              "absolute top-3 left-3 h-6 px-2.5",
              course.tag === "Live"
                ? "bg-red-500 text-white"
                : "bg-highlight text-highlight-foreground"
            )}
          >
            {course.tag === "Live" && (
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
            )}
            {course.tag}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{category.title}</Badge>
          <span className="flex items-center gap-1 text-sm font-medium">
            <Star className="size-4 fill-highlight text-highlight" aria-hidden />
            {course.rating.toFixed(1)}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg leading-snug font-semibold">
          {course.title}
        </h3>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <BookOpen className="size-4" aria-hidden />
            {course.lessons} lessons
          </li>
          <li className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {course.durationWeeks} weeks
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden />
            {formatCompact(course.students)}+ students
          </li>
        </ul>

        <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <p className="font-heading text-2xl font-bold text-primary">
              {formatTaka(course.price)}
            </p>
            {course.originalPrice && (
              <p className="text-sm text-muted-foreground">
                <span className="line-through">{formatTaka(course.originalPrice)}</span>
                <span className="ml-2 font-medium text-success">{discount}% off</span>
              </p>
            )}
          </div>
          <Link
            href={`/register?course=${course.id}`}
            className={buttonClass({ size: "lg", className: "px-4" })}
          >
            Enroll Now
          </Link>
        </div>
        </div>
      </div>
    </article>
  );
}
