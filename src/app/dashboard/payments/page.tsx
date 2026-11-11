import { Suspense } from "react";
import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { getPayments } from "@/lib/dashboard/data";
import { formatTaka } from "@/lib/format";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge, formatDate } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Payment History" };

const methodLabels: Record<string, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", card: "Card", bank: "Bank", cash: "Cash", sslcommerz: "Online (SSLCommerz)",
};

export default function PaymentsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Payments />
    </Suspense>
  );
}

async function Payments() {
  await requireUser("/dashboard/payments");
  const payments = await getPayments();

  return (
    <div className="space-y-6">
      <PageHeader title="Payment History" description="All payments you have submitted and their status." />
      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" text="Payments you make for courses and books will be listed here." />
      ) : (
        <Panel className="p-0 sm:p-0">
          <ul className="divide-y">
            {payments.map((p) => (
              <li key={p.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:p-5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.course?.title ?? p.book?.title ?? "Payment"}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatDate(p.created_at)} · {methodLabels[p.method] ?? p.method}
                    {p.transaction_id && <> · TrxID <span className="font-mono">{p.transaction_id}</span></>}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="font-heading text-lg font-bold">{formatTaka(Number(p.amount))}</span>
                  <StatusBadge
                    status={p.status === "pending" && p.method === "sslcommerz" && p.gateway_status !== "HIGH_RISK" ? "expired" : p.status}
                    label={p.status === "pending" && p.method === "sslcommerz" && p.gateway_status !== "HIGH_RISK" ? "Not completed" : undefined}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
