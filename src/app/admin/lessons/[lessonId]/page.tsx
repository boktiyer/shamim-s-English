import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getLesson } from "@/lib/admin/data";
import { ActionButton, AdminForm } from "@/components/admin/forms";
import { Checkbox, Field, Select, TextArea, TextInput, lessonTypeOptions } from "@/components/admin/fields";
import { DashboardSkeleton, Panel } from "@/components/dashboard/ui";
import { deleteLesson, updateLesson } from "../../actions";

export const metadata: Metadata = { title: "Edit lesson" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditLessonPage({ params }: PageProps<"/admin/lessons/[lessonId]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <EditLesson params={params} />
    </Suspense>
  );
}

async function EditLesson({ params }: Pick<PageProps<"/admin/lessons/[lessonId]">, "params">) {
  const { lessonId } = await params;
  await requireAdmin(`/admin/lessons/${lessonId}`);
  if (!UUID.test(lessonId)) notFound();
  const lesson = await getLesson(lessonId);
  if (!lesson) notFound();
  const course = lesson.chapter.subject.course;

  return (
    <div className="space-y-6">
      <Link href={`/admin/courses/${course.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {course.title}
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">
          {lesson.chapter.subject.title} · {lesson.chapter.title}
        </p>
        <h1 className="text-h2">{lesson.title}</h1>
      </div>

      <Panel title="Lesson details">
        <AdminForm action={updateLesson} submitLabel="Save lesson">
          <input type="hidden" name="id" value={lesson.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <TextInput name="title" defaultValue={lesson.title} required />
            </Field>
            <Field label="Type">
              <Select name="type" defaultValue={lesson.type} options={lessonTypeOptions} />
            </Field>
            <Field label="Position (order in chapter)">
              <TextInput name="position" type="number" min={0} defaultValue={lesson.position} />
            </Field>
            <Field label="Video link (YouTube or any URL)" className="sm:col-span-2">
              <TextInput name="video_url" type="url" defaultValue={lesson.video_url ?? ""} placeholder="https://www.youtube.com/watch?v=…" />
            </Field>
            <Field label="Notes / PDF link (shown in Notes & PDFs)" className="sm:col-span-2">
              <TextInput name="attachment_url" type="url" defaultValue={lesson.attachment_url ?? ""} placeholder="https://drive.google.com/…" />
            </Field>
            <Field label="Duration (minutes)">
              <TextInput name="duration_minutes" type="number" min={0} defaultValue={lesson.duration_minutes ?? ""} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox name="is_free_preview" label="Free preview (visible without enrollment)" defaultChecked={lesson.is_free_preview} />
            </div>
            <Field label="Short description" className="sm:col-span-2">
              <TextInput name="description" defaultValue={lesson.description ?? ""} />
            </Field>
            <Field label="Lesson notes (text shown under the video)" className="sm:col-span-2">
              <TextArea name="content" defaultValue={lesson.content ?? ""} className="min-h-40" />
            </Field>
          </div>
        </AdminForm>
      </Panel>

      <Panel title="Danger zone" className="border-destructive/30">
        <ActionButton
          action={deleteLesson}
          fields={{ id: lesson.id, course_id: course.id }}
          label="Delete lesson"
          variant="destructive"
          confirmText="Delete this lesson and students' progress on it?"
        />
      </Panel>
    </div>
  );
}
