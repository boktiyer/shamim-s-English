import { Suspense } from "react";
import type { Metadata } from "next";
import { Bell, Pin } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getCourses, getNotices, type AdminCourse, type AdminNotice } from "@/lib/admin/data";
import { ActionButton, AdminForm } from "@/components/admin/forms";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/admin/fields";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge, formatDate } from "@/components/dashboard/ui";
import { createNotice, deleteNotice, updateNotice } from "../actions";

export const metadata: Metadata = { title: "Notices" };

function NoticeFields({ notice, courses }: { notice?: AdminNotice; courses: AdminCourse[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {notice && <input type="hidden" name="id" value={notice.id} />}
      <Field label="Title">
        <TextInput name="title" defaultValue={notice?.title} required />
      </Field>
      <Field label="Who can see it">
        <Select
          name="course_id"
          defaultValue={notice?.course_id ?? ""}
          options={[{ value: "", label: "Everyone (general notice)" }, ...courses.map((c) => ({ value: c.id, label: `Students of: ${c.title}` }))]}
        />
      </Field>
      <Field label="Message" className="sm:col-span-2">
        <TextArea name="body" defaultValue={notice?.body} required />
      </Field>
      <div className="flex flex-wrap gap-6">
        <Checkbox name="is_published" label="Published" defaultChecked={notice?.is_published ?? true} />
        <Checkbox name="is_pinned" label="Pinned to top" defaultChecked={notice?.is_pinned} />
      </div>
    </div>
  );
}

export default function NoticesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Notices />
    </Suspense>
  );
}

async function Notices() {
  await requireAdmin("/admin/notices");
  const [notices, courses] = await Promise.all([getNotices(), getCourses()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Notices" description="General notices are visible to everyone; course notices only to enrolled students." />

      <Panel title="Post a notice">
        <AdminForm action={createNotice} submitLabel="Post notice">
          <NoticeFields courses={courses} />
        </AdminForm>
      </Panel>

      {notices.length === 0 && <EmptyState icon={Bell} title="No notices yet" text="Notices you post appear here." />}
      {notices.map((n) => (
        <Panel key={n.id}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {n.is_pinned && (
              <span className="flex items-center gap-1 font-medium text-primary">
                <Pin className="size-3" aria-hidden /> Pinned
              </span>
            )}
            <span>{formatDate(n.published_at)}</span>
            <span>· {n.course?.title ?? "Everyone"}</span>
            <StatusBadge status={n.is_published ? "active" : "expired"} label={n.is_published ? "Published" : "Draft"} />
          </div>
          <p className="mt-2 font-semibold">{n.title}</p>
          <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{n.body}</p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-primary">Edit notice</summary>
            <div className="mt-4 space-y-4">
              <AdminForm action={updateNotice} submitLabel="Save notice">
                <NoticeFields notice={n} courses={courses} />
              </AdminForm>
              <ActionButton action={deleteNotice} fields={{ id: n.id }} label="Delete notice" variant="destructive" confirmText="Delete this notice?" />
            </div>
          </details>
        </Panel>
      ))}
    </div>
  );
}
