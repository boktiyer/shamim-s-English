import { Suspense } from "react";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { getActiveCourses, getEnrollments } from "@/lib/dashboard/data";
import { CourseProgressCard } from "@/components/dashboard/course-progress-card";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge, categoryLabels, formatDate } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "My Courses" };

export default function MyCoursesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MyCourses />
    </Suspense>
  );
}

async function MyCourses() {
  await requireUser("/dashboard/courses");
  const [{ courses }, enrollments] = await Promise.all([getActiveCourses(), getEnrollments()]);
  const activeIds = new Set(courses.map((c) => c.courseId));
  const others = enrollments.filter((e) => !e.course || !activeIds.has(e.course.id));

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Only approved enrollments can be opened for learning." />

      {courses.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseProgressCard key={c.courseId} item={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No active courses yet"
          text="Enroll in a course and it will appear here once your payment is approved."
          cta={{ href: "/#courses", label: "Explore Courses" }}
        />
      )}

      {others.length > 0 && (
        <Panel title="Enrollment status">
          <ul className="divide-y">
            {others.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium">{e.course?.title ?? "Course no longer available"}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.course ? `${categoryLabels[e.course.category]} · ` : ""}
                    {e.status === "expired" ? `Ended ${formatDate(e.expires_at)}` : `Requested ${formatDate(e.enrolled_at)}`}
                  </p>
                </div>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
