import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { AdminPayment } from "@/lib/admin/data";
import { formatTaka } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "@/components/admin/forms";
import { StatusBadge, formatDate } from "@/components/dashboard/ui";
import { approvePayment, rejectPayment } from "../actions";

export const paymentMethodLabels: Record<string, string> = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", card: "Card", bank: "Bank", cash: "Cash", sslcommerz: "SSLCommerz (online)",
};

/** One payment with student details, screenshot and Approve / Reject when it needs a person. */
export async function PaymentRow({ payment: p }: { payment: AdminPayment }) {
  let proofUrl: string | null = null;
  if (p.screenshot_path) {
    const supabase = await createClient(); // admin session: Storage RLS lets admins read all proofs
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(p.screenshot_path, 60 * 30);
    proofUrl = data?.signedUrl ?? null;
  }
  const online = p.method === "sslcommerz";
  const needsPerson = p.status === "pending" && (!online || p.gateway_status === "HIGH_RISK");

  return (
    <li className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-medium">
          {p.student ? (
            <Link href={`/admin/students?q=${p.student.student_id}`} className="hover:text-primary">
              {p.student.full_name || "Unnamed"}{" "}
              <span className="font-mono text-xs text-muted-foreground">{p.student.student_id}</span>
            </Link>
          ) : (
            "Deleted student"
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {p.course?.title ?? p.book?.title ?? "—"} · <span className="font-semibold text-foreground">{formatTaka(Number(p.amount))}</span> via{" "}
          {paymentMethodLabels[p.method] ?? p.method}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(p.created_at)}
          {p.transaction_id && <> · {online ? "Tran" : "TrxID"} <span className="font-mono">{p.transaction_id}</span></>}
          {p.sender_number && <> · from {p.sender_number}</>}
          {p.student?.phone && <> · phone {p.student.phone}</>}
          {p.gateway_status === "HIGH_RISK" && <span className="font-semibold text-destructive"> · SSLCommerz flagged as high risk</span>}
        </p>
        {proofUrl && (
          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ImageIcon className="size-4" aria-hidden /> View screenshot
          </a>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {needsPerson ? (
          <>
            <ActionButton action={approvePayment} fields={{ id: p.id }} label="Approve" variant="default" />
            <ActionButton
              action={rejectPayment}
              fields={{ id: p.id }}
              label="Reject"
              variant="destructive"
              confirmText="Reject this payment? The student will not get access."
            />
          </>
        ) : (
          <StatusBadge status={p.status} label={p.status === "pending" && online ? "Not completed" : undefined} />
        )}
      </div>
    </li>
  );
}
