import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getPayments } from "@/lib/admin/data";
import { DashboardSkeleton, EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { PaymentRow } from "./payment-row";

export const metadata: Metadata = { title: "Approvals" };

const tabs = [
  { status: "pending", label: "Pending" },
  { status: "completed", label: "Approved" },
  { status: "failed", label: "Rejected" },
  { status: "all", label: "All" },
];

export default function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Payments searchParams={searchParams} />
    </Suspense>
  );
}

async function Payments({ searchParams }: Pick<PageProps<"/admin/payments">, "searchParams">) {
  await requireAdmin("/admin/payments");
  const { status: raw } = await searchParams;
  const status = tabs.some((t) => t.status === raw) ? String(raw) : "pending";
  const payments = await getPayments(status === "all" ? undefined : status, 200);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals & Payments"
        description="Approve a payment to give the student access to the course. Rejecting keeps the course locked."
      />
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.status}
            href={`/admin/payments?status=${t.status}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
              status === t.status ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Panel>
        {payments.length ? (
          <ul className="divide-y">
            {payments.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={BadgeCheck} title="Nothing here" text="No payments in this list." />
        )}
      </Panel>
    </div>
  );
}
