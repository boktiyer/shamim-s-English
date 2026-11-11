import Link from "next/link";
import type { AdminPayment } from "@/lib/admin/data";
import { formatTaka } from "@/lib/format";
import { ActionButton } from "@/components/admin/forms";
import { StatusBadge, formatDate } from "@/components/dashboard/ui";
import { approvePayment, rejectPayment } from "../actions";

const methods: Record<string, string> = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket", card: "Card", bank: "Bank", cash: "Cash" };

/** One payment with student details and Approve / Reject for pending ones. */
export function PaymentRow({ payment: p }: { payment: AdminPayment }) {
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
          {methods[p.method] ?? p.method}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(p.created_at)}
          {p.transaction_id && <> · TrxID <span className="font-mono">{p.transaction_id}</span></>}
          {p.sender_number && <> · from {p.sender_number}</>}
          {p.student?.phone && <> · phone {p.student.phone}</>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {p.status === "pending" ? (
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
          <StatusBadge status={p.status} />
        )}
      </div>
    </li>
  );
}
