import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, MapPin, Package, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getBookOrders, type AdminBookOrder } from "@/lib/admin/data";
import { createClient } from "@/lib/supabase/server";
import { formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminForm } from "@/components/admin/forms";
import { Select, TextInput } from "@/components/admin/fields";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge, formatDate } from "@/components/dashboard/ui";
import { paymentMethodLabels } from "../payments/payment-row";
import { setBookOrderStatus } from "../actions";

export const metadata: Metadata = { title: "Book Orders" };

const FILTERS = [
  { value: "pending", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const NEXT: Record<string, { value: string; label: string }[]> = {
  pending: [{ value: "confirmed", label: "Confirm (payment verified)" }, { value: "cancelled", label: "Cancel / reject" }],
  confirmed: [{ value: "shipped", label: "Mark shipped" }, { value: "cancelled", label: "Cancel" }],
  shipped: [{ value: "delivered", label: "Mark delivered" }, { value: "cancelled", label: "Cancel (returned)" }],
};

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin("/admin/orders");
  const { status: raw } = await searchParams;
  const filter = FILTERS.some((f) => f.value === raw) ? String(raw) : "pending";
  const orders = await getBookOrders(filter === "all" ? undefined : filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Book Orders" description="Check the payment, confirm, then mark orders shipped and delivered." />

      <nav aria-label="Filter orders" className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/orders?status=${f.value}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
              f.value === filter ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders here" text="Orders students place on a book page show up here." />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

async function OrderCard({ order: o }: { order: AdminBookOrder }) {
  let proofUrl: string | null = null;
  if (o.payment?.screenshot_path) {
    const supabase = await createClient(); // admin session: Storage RLS lets admins read all proofs
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(o.payment.screenshot_path, 60 * 30);
    proofUrl = data?.signedUrl ?? null;
  }
  const next = NEXT[o.status] ?? [];

  return (
    <Panel
      title={`${o.book_title} × ${o.quantity}`}
      action={
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{o.order_no}</span>
          <StatusBadge status={o.status} label={o.status === "pending" ? "New" : undefined} />
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {o.student ? (
              <Link href={`/admin/students?q=${o.student.student_id}`} className="hover:text-primary">
                {o.student.full_name || "Unnamed"} <span className="font-mono text-xs text-muted-foreground">{o.student.student_id}</span>
              </Link>
            ) : (
              "Deleted student"
            )}
          </p>
          <p className="text-muted-foreground">Ordered {formatDate(o.created_at)}</p>
          <p className="pt-2 font-medium">{o.recipient_name}</p>
          <p className="flex items-center gap-1.5"><Phone className="size-3.5 text-muted-foreground" aria-hidden /> <a href={`tel:${o.phone}`} className="hover:text-primary">{o.phone}</a></p>
          <p className="flex items-start gap-1.5 whitespace-pre-line"><MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden /> {o.address}</p>
          {o.note && <p className="text-muted-foreground">Note: {o.note}</p>}
        </div>

        <div className="space-y-1 text-sm">
          <p>
            <span className="font-heading text-lg font-bold">{Number(o.total) ? formatTaka(Number(o.total)) : "Free"}</span>
            {o.quantity > 1 && Number(o.unit_price) > 0 && <span className="text-muted-foreground"> ({formatTaka(Number(o.unit_price))} each)</span>}
          </p>
          {o.payment ? (
            <>
              <p className="flex flex-wrap items-center gap-2">
                {paymentMethodLabels[o.payment.method] ?? o.payment.method}
                <StatusBadge status={o.payment.status} label={o.payment.status === "pending" ? "Payment not verified" : undefined} />
              </p>
              <p className="text-muted-foreground">
                TrxID <span className="font-mono text-foreground">{o.payment.transaction_id}</span>
                {o.payment.sender_number && <> · from {o.payment.sender_number}</>}
              </p>
              {proofUrl && (
                <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  <ImageIcon className="size-4" aria-hidden /> View screenshot
                </a>
              )}
            </>
          ) : (
            Number(o.total) === 0 && <p className="text-muted-foreground">Free copy for an enrolled student</p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <AdminForm action={setBookOrderStatus} submitLabel="Update" compact>
          <input type="hidden" name="id" value={o.id} />
          {next.length > 0 && (
            <label className="block min-w-48 flex-1 space-y-1.5 sm:flex-none">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <Select name="status" options={[{ value: "", label: "Keep as is" }, ...next]} defaultValue="" />
            </label>
          )}
          <label className="block min-w-48 flex-1 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Note to student (e.g. courier tracking)</span>
            <TextInput name="admin_note" defaultValue={o.admin_note ?? ""} maxLength={500} />
          </label>
        </AdminForm>
      </div>
    </Panel>
  );
}
