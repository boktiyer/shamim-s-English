import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CirclePlay, FileText, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getCourseTree } from "@/lib/admin/data";
import { ActionButton, AdminForm } from "@/components/admin/forms";
import { Select, TextInput, lessonTypeOptions } from "@/components/admin/fields";
import { DashboardSkeleton, Panel } from "@/components/dashboard/ui";
import {
  createChapter,
  createLesson,
  createSubject,
  deleteChapter,
  deleteCourse,
  deleteSubject,
  updateChapter,
  updateCourse,
  updateSubject,
} from "../../actions";
import { CourseFields } from "../course-fields";

export const metadata: Metadata = { title: "Edit course" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditCoursePage({ params }: PageProps<"/admin/courses/[courseId]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <EditCourse params={params} />
    </Suspense>
  );
}

/** Title + position inline editor used for subjects and chapters. */
function OutlineEditor({
  id,
  title,
  position,
  update,
  remove,
  kind,
}: {
  id: string;
  title: string;
  position: number;
  update: typeof updateSubject;
  remove: typeof deleteSubject;
  kind: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <AdminForm action={update} submitLabel="Save" compact className="flex-1">
        <input type="hidden" name="id" value={id} />
        <TextInput name="title" defaultValue={title} aria-label={`${kind} title`} className="h-9 min-w-48 flex-1" />
        <TextInput name="position" type="number" defaultValue={position} aria-label="Position" className="h-9 w-20" />
      </AdminForm>
      <ActionButton
        action={remove}
        fields={{ id }}
        label="Delete"
        variant="ghost"
        confirmText={`Delete this ${kind} and everything inside it?`}
      />
    </div>
  );
}

async function EditCourse({ params }: Pick<PageProps<"/admin/courses/[courseId]">, "params">) {
  const { courseId } = await params;
  await requireAdmin(`/admin/courses/${courseId}`);
  if (!UUID.test(courseId)) notFound();
  const course = await getCourseTree(courseId);
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All courses
      </Link>
      <h1 className="text-h2">{course.title}</h1>

      {/* Course content */}
      <Panel title="Subjects, chapters & lessons">
        <div className="space-y-6">
          {course.subjects.map((subject) => (
            <div key={subject.id} className="rounded-xl border p-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-primary uppercase">Subject</p>
              <OutlineEditor id={subject.id} title={subject.title} position={subject.position} update={updateSubject} remove={deleteSubject} kind="subject" />

              <div className="mt-4 space-y-4 border-l-2 pl-4">
                {subject.chapters.map((chapter) => (
                  <div key={chapter.id}>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Chapter</p>
                    <OutlineEditor id={chapter.id} title={chapter.title} position={chapter.position} update={updateChapter} remove={deleteChapter} kind="chapter" />

                    <ul className="mt-3 divide-y rounded-lg border">
                      {chapter.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link href={`/admin/lessons/${lesson.id}`} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent">
                            {lesson.type === "pdf" ? (
                              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            ) : (
                              <CirclePlay className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            )}
                            <span className="w-6 text-xs text-muted-foreground">{lesson.position}</span>
                            <span className="flex-1 font-medium">{lesson.title}</span>
                            {!lesson.is_published && <span className="rounded bg-highlight/25 px-1.5 text-xs font-medium text-highlight-foreground">Draft</span>}
                            {lesson.is_free_preview && <span className="text-xs font-medium text-success">Free preview</span>}
                            {lesson.stream_video_id && <span className="text-xs font-medium text-primary">Video</span>}
                            {lesson.attachment_path && <span className="text-xs font-medium text-primary">PDF</span>}
                            {!lesson.stream_video_id && !lesson.video_url && !lesson.attachment_url && !lesson.attachment_path && <span className="text-xs text-destructive">No content</span>}
                            <Pencil className="size-3.5 text-muted-foreground" aria-hidden />
                          </Link>
                        </li>
                      ))}
                      <li className="bg-muted/40 px-3 py-2.5">
                        <AdminForm action={createLesson} submitLabel="Add lesson" compact>
                          <input type="hidden" name="chapter_id" value={chapter.id} />
                          <TextInput name="title" placeholder="New lesson title" aria-label="New lesson title" className="h-9 min-w-48 flex-1" />
                          <Select name="type" options={lessonTypeOptions} aria-label="Lesson type" className="h-9 w-32" />
                          <TextInput name="position" type="number" defaultValue={chapter.lessons.length + 1} aria-label="Position" className="h-9 w-20" />
                        </AdminForm>
                      </li>
                    </ul>
                  </div>
                ))}

                <AdminForm action={createChapter} submitLabel="Add chapter" compact>
                  <input type="hidden" name="subject_id" value={subject.id} />
                  <TextInput name="title" placeholder="New chapter, e.g. Unit 1: Reading" aria-label="New chapter title" className="h-9 min-w-48 flex-1" />
                  <TextInput name="position" type="number" defaultValue={subject.chapters.length + 1} aria-label="Position" className="h-9 w-20" />
                </AdminForm>
              </div>
            </div>
          ))}

          <AdminForm action={createSubject} submitLabel="Add subject" compact className="rounded-xl border border-dashed p-4">
            <input type="hidden" name="course_id" value={course.id} />
            <TextInput name="title" placeholder="New subject, e.g. English 1st Paper" aria-label="New subject title" className="h-9 min-w-48 flex-1" />
            <TextInput name="position" type="number" defaultValue={course.subjects.length + 1} aria-label="Position" className="h-9 w-20" />
          </AdminForm>
        </div>
      </Panel>

      {/* Course details */}
      <Panel title="Course details">
        <AdminForm action={updateCourse} submitLabel="Save course">
          <CourseFields course={course} />
        </AdminForm>
      </Panel>

      <Panel title="Danger zone" className="border-destructive/30">
        <p className="mb-3 text-sm text-muted-foreground">
          Deleting removes all subjects, chapters, lessons and enrollments of this course. To hide it instead, set the status to Archived.
        </p>
        <ActionButton
          action={deleteCourse}
          fields={{ id: course.id }}
          label="Delete course"
          variant="destructive"
          confirmText="Permanently delete this course, its lessons and its enrollments?"
        />
      </Panel>
    </div>
  );
}
