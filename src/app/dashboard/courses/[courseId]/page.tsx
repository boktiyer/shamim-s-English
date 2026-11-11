import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleCheck, CirclePlay, FileText, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { getActiveCourses, getCourseOutline, getEnrollments } from "@/lib/dashboard/data";
import { buttonClass } from "@/lib/button-class";
import { DashboardSkeleton, EmptyState, Panel, ProgressBar, StatusBadge } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Course" };

export default function CoursePage({ params }: PageProps<"/dashboard/courses/[courseId]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <CourseContent params={params} />
    </Suspense>
  );
}

async function CourseContent({ params }: Pick<PageProps<"/dashboard/courses/[courseId]">, "params">) {
  const { courseId } = await params;
  await requireUser(`/dashboard/courses/${courseId}`);
  const [{ courses, completedIds }, enrollments] = await Promise.all([getActiveCourses(), getEnrollments()]);

  const back = (
    <Link href="/dashboard/courses" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> My Courses
    </Link>
  );

  const active = courses.find((c) => c.courseId === courseId);
  if (!active) {
    // Not approved (or not enrolled): show the status, never the lessons.
    const enrollment = enrollments.find((e) => e.course?.id === courseId);
    return (
      <div>
        {back}
        <EmptyState
          icon={Lock}
          title={enrollment ? "This course is not unlocked yet" : "You are not enrolled in this course"}
          text={
            enrollment?.status === "pending"
              ? "Your enrollment is waiting for approval. You'll get access as soon as your payment is verified."
              : enrollment
                ? "Your access to this course has ended. Contact us to renew it."
                : "Enroll in this course to start learning."
          }
          cta={{ href: enrollment ? "/dashboard/payments" : "/#courses", label: enrollment ? "View payments" : "Explore Courses" }}
        />
        {enrollment && (
          <p className="mt-4 text-center">
            <StatusBadge status={enrollment.status} />
          </p>
        )}
      </div>
    );
  }

  // Group the outline: subject -> chapter -> lessons
  const outline = await getCourseOutline(courseId);
  const subjects = new Map<string, { title: string; chapters: Map<string, { title: string; lessons: typeof outline }> }>();
  for (const row of outline) {
    if (!subjects.has(row.subject_id)) subjects.set(row.subject_id, { title: row.subject_title, chapters: new Map() });
    if (!row.chapter_id) continue;
    const chapters = subjects.get(row.subject_id)!.chapters;
    if (!chapters.has(row.chapter_id)) chapters.set(row.chapter_id, { title: row.chapter_title ?? "", lessons: [] });
    if (row.lesson_id) chapters.get(row.chapter_id)!.lessons.push(row);
  }

  const { course, progress } = active;

  return (
    <div className="space-y-6">
      {back}
      <Panel>
        <h1 className="text-h2">{course.title}</h1>
        {course.subtitle && <p className="mt-1 text-muted-foreground">{course.subtitle}</p>}
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {progress.completed} of {progress.total} lessons completed
          </span>
          <span className="font-semibold">{progress.percent}%</span>
        </div>
        <ProgressBar percent={progress.percent} className="mt-2" />
        {progress.nextLessonId && (
          <Link href={`/dashboard/learn/${progress.nextLessonId}`} className={buttonClass({ size: "lg", className: "mt-5 h-11 px-6" })}>
            <CirclePlay data-icon="inline-start" aria-hidden />
            {progress.completed ? "Continue Learning" : "Start Learning"}
          </Link>
        )}
      </Panel>

      {[...subjects.values()].map((subject) => (
        <Panel key={subject.title} title={subject.title}>
          {subject.chapters.size === 0 && <p className="text-sm text-muted-foreground">Chapters coming soon.</p>}
          <div className="space-y-5">
            {[...subject.chapters.values()].map((chapter) => (
              <div key={chapter.title}>
                <h3 className="text-sm font-semibold text-muted-foreground">{chapter.title}</h3>
                <ul className="mt-2 divide-y rounded-xl border">
                  {chapter.lessons.map((l) => {
                    const done = completedIds.has(l.lesson_id!);
                    const isNext = l.lesson_id === progress.nextLessonId;
                    return (
                      <li key={l.lesson_id}>
                        <Link
                          href={`/dashboard/learn/${l.lesson_id}`}
                          className={cn("flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent", isNext && "bg-secondary/60")}
                        >
                          {done ? (
                            <CircleCheck className="size-5 shrink-0 text-success" aria-label="Completed" />
                          ) : l.lesson_type === "pdf" ? (
                            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                          ) : (
                            <CirclePlay className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                          )}
                          <span className="flex-1 font-medium">{l.lesson_title}</span>
                          {isNext && <span className="text-xs font-semibold text-primary">Up next</span>}
                          {l.duration_minutes ? <span className="text-xs text-muted-foreground">{l.duration_minutes} min</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                  {chapter.lessons.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">Lessons coming soon.</li>}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
