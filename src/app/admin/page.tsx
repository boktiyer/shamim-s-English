import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Clock, GraduationCap, Users, Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getPayments, getStats } from "@/lib/admin/data";
import { formatTaka } from "@/lib/format";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, formatDate } from "@/components/dashboard/ui";
import { PaymentRow } from "./payments/payment-row";

export default function AdminHome() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const admin = await requireAdmin("/admin");
  const [stats, pending] = await Promise.all([getStats(), getPayments("pending", 5)]);

  const cards = [
    { icon: Users, label: "Students", value: stats.students, href: "/admin/students" },
    { icon: GraduationCap, label: "Active enrollments", value: stats.activeEnrollments, href: "/admin/enrollments" },
    { icon: Clock, label: "Pending approvals", value: stats.pendingPayments + stats.pendingEnrollments, href: "/admin/payments", highlight: true },
    { icon: BookOpen, label: "Published courses", value: `${stats.publishedCourses}/${stats.courses}`, href: "/admin/courses" },
    { icon: Wallet, label: "Revenue (approved)", value: formatTaka(stats.revenue), href: "/admin/payments?status=completed" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${admin.full_name.split(" ")[0] || "Admin"}`} description={`Admin Panel · ${formatDate(new Date().toISOString())}`} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        {cards.map(({ icon: Icon, label, value, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5 ${highlight && Number(value) > 0 ? "border-highlight bg-highlight/10" : ""}`}
          >
            <Icon className="size-5 text-primary" aria-hidden />
            <p className="mt-3 font-heading text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          </Link>
        ))}
      </div>

      <Panel
        title="Waiting for approval"
        action={
          <Link href="/admin/payments" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All approvals <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      >
        {pending.length ? (
          <ul className="divide-y">
            {pending.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={BadgeCheck} title="All caught up" text="No payments are waiting for approval." />
        )}
      </Panel>
    </div>
  );
}
