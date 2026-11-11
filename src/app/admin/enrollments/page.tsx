import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getCourses, getEnrollments } from "@/lib/admin/data";
import { ActionButton, AdminForm } from "@/components/admin/forms";
import { Field, Select, TextInput } from "@/components/admin/fields";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge, formatDate } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { grantEnrollment, setEnrollmentStatus } from "../actions";

export const metadata: Metadata = { title: "Enrollments" };

const tabs = ["all", "active", "pending", "expired", "cancelled"];

export default function EnrollmentsPage({ searchParams }: PageProps<"/admin/enrollments">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Enrollments searchParams={searchParams} />
    </Suspense>
  );
}

async function Enrollments({ searchParams }: Pick<PageProps<"/admin/enrollments">, "searchParams">) {
  await requireAdmin("/admin/enrollments");
  const { status: raw } = await searchParams;
  const status = tabs.includes(String(raw)) ? String(raw) : "all";
  const [enrollments, courses] = await Promise.all([getEnrollments(status === "all" ? undefined : status), getCourses()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Enrollments" description="Who can access which course. Only active enrollments unlock lessons." />

      <Panel title="Give a student access">
        {courses.length ? (
          <AdminForm action={grantEnrollment} submitLabel="Grant access" className="grid gap-4 space-y-0 sm:grid-cols-3 [&>button]:w-fit">
            <Field label="Student ID">
              <TextInput name="student_id" placeholder="SE2600001" required />
            </Field>
            <Field label="Course">
              <Select name="course_id" required options={courses.map((c) => ({ value: c.id, label: `${c.title}${c.status !== "published" ? ` (${c.status})` : ""}` }))} />
            </Field>
            <Field label="Access until (optional)">
              <TextInput name="expires_at" type="date" />
            </Field>
          </AdminForm>
        ) : (
          <p className="text-sm text-muted-foreground">Create a course first.</p>
        )}
      </Panel>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/enrollments?status=${t}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium capitalize",
              status === t ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      <Panel>
        {enrollments.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No enrollments" text="Approved payments and granted access appear here." />
        ) : (
          <ul className="divide-y">
            {enrollments.map((e) => (
              <li key={e.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-medium">
                    {e.student?.full_name || "Deleted student"}{" "}
                    <span className="font-mono text-xs text-muted-foreground">{e.student?.student_id}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{e.course?.title ?? "Deleted course"}</p>
                  <p className="text-xs text-muted-foreground">
                    Since {formatDate(e.enrolled_at)}
                    {e.expires_at && <> · until {formatDate(e.expires_at)}</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={e.status} />
                  {e.status !== "active" && (
                    <ActionButton action={setEnrollmentStatus} fields={{ id: e.id, status: "active" }} label="Activate" variant="default" />
                  )}
                  {e.status !== "cancelled" && (
                    <ActionButton
                      action={setEnrollmentStatus}
                      fields={{ id: e.id, status: "cancelled" }}
                      label="Cancel"
                      variant="destructive"
                      confirmText="Cancel this enrollment? The student will lose access."
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
