import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleCheck, CirclePlay, Clock, IdCard, Bell } from "lucide-react";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";
import { getActiveCourses, getEnrollments, getNotices, getPayments } from "@/lib/dashboard/data";
import { pickContinue } from "@/lib/dashboard/progress";
import { buttonClass } from "@/lib/button-class";
import { FormAlert } from "@/components/auth/form-parts";
import { CourseProgressCard } from "@/components/dashboard/course-progress-card";
import { NoticeList } from "@/components/dashboard/notice-list";
import { DashboardSkeleton, EmptyState, Panel, ProgressBar, StatusBadge, formatDate } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Student Dashboard" };

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  await requireUser("/dashboard");
  const [profile, params, { courses, completedIds, lastActivity }, enrollments, payments, notices] = await Promise.all([
    getCurrentProfile(),
    searchParams,
    getActiveCourses(),
    getEnrollments(),
    getPayments(),
    getNotices(3),
  ]);

  const continueItem = pickContinue(courses, lastActivity);
  const pendingEnrollments = enrollments.filter((e) => e.status === "pending");
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course?.id));
  // Payments submitted for a course the admin hasn't enrolled them in yet
  const pendingPayments = payments.filter(
    (p) => p.status === "pending" && (!p.course || !enrolledCourseIds.has(p.course.id))
  );

  const stats = [
    { icon: BookOpen, label: "Active courses", value: courses.length },
    { icon: CircleCheck, label: "Lessons completed", value: completedIds.size },
    { icon: Clock, label: "Pending approval", value: pendingEnrollments.length + pendingPayments.length },
  ];

  return (
    <div className="space-y-6">
      {params.message === "password_updated" && <FormAlert type="success">Your password has been updated.</FormAlert>}

      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-indigo-950 p-6 text-primary-foreground sm:p-8">
        <div aria-hidden className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10" />
        <p className="relative text-sm text-primary-foreground/80">Welcome back,</p>
        <h1 className="relative mt-1 text-h1 text-primary-foreground">{profile?.full_name || "Student"} 👋</h1>
        <p className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">
          <IdCard className="size-4 text-highlight" aria-hidden />
          Student ID: <span className="font-mono tracking-wide">{profile?.student_id ?? "—"}</span>
        </p>
      </section>

      {/* Stats */}
      <dl className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border bg-card p-4 sm:p-5">
            <Icon className="size-5 text-primary" aria-hidden />
            <dd className="mt-3 font-heading text-2xl font-bold sm:text-3xl">{value}</dd>
            <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
          </div>
        ))}
      </dl>

      {/* Continue learning */}
      {continueItem && (
        <Panel className="border-primary/30 bg-secondary/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">Continue learning</p>
              <p className="mt-1 truncate font-semibold">{continueItem.course.title}</p>
              <p className="truncate text-sm text-muted-foreground">Next: {continueItem.progress.nextLessonTitle}</p>
              <ProgressBar percent={continueItem.progress.percent} className="mt-3 max-w-sm" />
            </div>
            <Link
              href={`/dashboard/learn/${continueItem.progress.nextLessonId}`}
              className={buttonClass({ size: "lg", className: "h-11 px-6" })}
            >
              <CirclePlay data-icon="inline-start" aria-hidden />
              Continue Learning
            </Link>
          </div>
        </Panel>
      )}

      {/* Pending approvals */}
      {(pendingEnrollments.length > 0 || pendingPayments.length > 0) && (
        <Panel title="Waiting for approval">
          <ul className="divide-y">
            {pendingEnrollments.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <span className="font-medium">{e.course?.title ?? "Course"}</span>
                <StatusBadge status="pending" />
              </li>
            ))}
            {pendingPayments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <span className="font-medium">
                  {p.course?.title ?? p.book?.title ?? "Payment"}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">submitted {formatDate(p.created_at)}</span>
                </span>
                <StatusBadge status="pending" label="Payment under review" />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Your course unlocks as soon as an admin verifies your payment.
          </p>
        </Panel>
      )}

      {/* My courses */}
      <Panel
        title="My Courses"
        action={
          courses.length > 0 && (
            <Link href="/dashboard/courses" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          )
        }
      >
        {courses.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.slice(0, 3).map((c) => (
              <CourseProgressCard key={c.courseId} item={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No active courses yet"
            text="Once your enrollment is approved, your courses will appear here."
            cta={{ href: "/#courses", label: "Explore Courses" }}
          />
        )}
      </Panel>

      {/* Notices */}
      <Panel
        title="Latest notices"
        action={
          <Link href="/dashboard/notices" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All notices <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      >
        {notices.length ? (
          <NoticeList notices={notices} compact />
        ) : (
          <EmptyState icon={Bell} title="No notices" text="Announcements from Shamim Sir will show up here." />
        )}
      </Panel>
    </div>
  );
}
