import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getCourses } from "@/lib/admin/data";
import { formatTaka } from "@/lib/format";
import { AdminForm } from "@/components/admin/forms";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge, categoryLabels } from "@/components/dashboard/ui";
import { createCourse } from "../actions";
import { CourseFields } from "./course-fields";

export const metadata: Metadata = { title: "Courses" };

const statusBadge: Record<string, string> = { published: "active", draft: "pending", archived: "expired" };

export default function CoursesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Courses />
    </Suspense>
  );
}

async function Courses() {
  await requireAdmin("/admin/courses");
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Create courses, then add subjects, chapters and lessons inside each one." />

      <Panel title="All courses">
        {courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses yet" text="Create your first course below." />
        ) : (
          <ul className="divide-y">
            {courses.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/courses/${c.id}`} className="flex items-center gap-3 py-3 hover:text-primary">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {categoryLabels[c.category]} · {formatTaka(Number(c.price))}
                    </p>
                  </div>
                  <StatusBadge status={statusBadge[c.status]} label={c.status[0].toUpperCase() + c.status.slice(1)} />
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Create a course">
        <AdminForm action={createCourse} submitLabel="Create course">
          <CourseFields />
        </AdminForm>
      </Panel>
    </div>
  );
}
