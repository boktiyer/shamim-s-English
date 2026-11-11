import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleCheck, Download, ExternalLink, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { getActiveCourses, getCourseOutline, getLesson } from "@/lib/dashboard/data";
import { youtubeId } from "@/lib/dashboard/progress";
import { signLessonFiles } from "@/lib/storage";
import { buttonClass } from "@/lib/button-class";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton, EmptyState, Panel } from "@/components/dashboard/ui";
import { setLessonComplete } from "../../actions";

export const metadata: Metadata = { title: "Lesson" };

export default function LessonPage({ params }: PageProps<"/dashboard/learn/[lessonId]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LessonContent params={params} />
    </Suspense>
  );
}

async function LessonContent({ params }: Pick<PageProps<"/dashboard/learn/[lessonId]">, "params">) {
  const { lessonId } = await params;
  await requireUser(`/dashboard/learn/${lessonId}`);
  const [lesson, { courses, completedIds }] = await Promise.all([getLesson(lessonId), getActiveCourses()]);

  // Lessons open only inside an approved, active enrollment.
  const course = lesson && courses.find((c) => c.courseId === lesson.chapter.subject.course_id);
  if (!lesson || !course) {
    return (
      <EmptyState
        icon={Lock}
        title="This lesson is locked"
        text="Lessons open once your enrollment in the course is approved."
        cta={{ href: "/dashboard/courses", label: "Back to My Courses" }}
      />
    );
  }

  const outline = (await getCourseOutline(course.courseId)).filter((l) => l.lesson_id);
  const index = outline.findIndex((l) => l.lesson_id === lesson.id);
  const prev = outline[index - 1];
  const next = outline[index + 1];
  const done = completedIds.has(lesson.id);
  const ytId = youtubeId(lesson.video_url);
  const pdfUrl = lesson.attachment_path ? (await signLessonFiles([lesson.attachment_path])).get(lesson.attachment_path) : undefined;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/courses/${course.courseId}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {course.course.title}
      </Link>

      <div>
        <p className="text-sm text-muted-foreground">
          {lesson.chapter.subject.title} · {lesson.chapter.title}
        </p>
        <h1 className="mt-1 text-h2">{lesson.title}</h1>
      </div>

      {ytId ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
            title={lesson.title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        lesson.video_url && (
          <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className={buttonClass({ size: "lg", className: "h-11 px-5" })}>
            <ExternalLink data-icon="inline-start" aria-hidden /> Open video
          </a>
        )
      )}

      {(lesson.description || lesson.content) && (
        <Panel>
          {lesson.description && <p className="font-medium">{lesson.description}</p>}
          {lesson.content && <div className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{lesson.content}</div>}
        </Panel>
      )}

      {(pdfUrl || lesson.attachment_url) && (
        <div className="flex flex-wrap gap-3">
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={buttonClass({ size: "lg", className: "h-11 px-5" })}>
              <Download data-icon="inline-start" aria-hidden /> Download PDF notes
            </a>
          )}
          {lesson.attachment_url && (
            <a href={lesson.attachment_url} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "outline", size: "lg", className: "h-11 px-5" })}>
              <ExternalLink data-icon="inline-start" aria-hidden /> Open notes link
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <form action={setLessonComplete}>
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="completed" value={done ? "false" : "true"} />
          <Button type="submit" size="lg" variant={done ? "outline" : "default"} className="h-11 w-full px-5 sm:w-auto">
            <CircleCheck data-icon="inline-start" aria-hidden />
            {done ? "Completed (undo)" : "Mark as complete"}
          </Button>
        </form>
        <div className="flex gap-2">
          {prev && (
            <Link href={`/dashboard/learn/${prev.lesson_id}`} className={buttonClass({ variant: "outline", size: "lg", className: "h-11 flex-1 px-4" })}>
              <ArrowLeft data-icon="inline-start" aria-hidden /> Previous
            </Link>
          )}
          {next && (
            <Link href={`/dashboard/learn/${next.lesson_id}`} className={buttonClass({ variant: "outline", size: "lg", className: "h-11 flex-1 px-4" })}>
              Next <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
