import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/lib/button-class";
import { cn } from "@/lib/utils";

/** Title row at the top of each dashboard page. */
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-h2">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Bordered white box used for every dashboard section. */
export function Panel({ title, action, className, children }: { title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-h3">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

const statusStyles: Record<string, string> = {
  active: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  pending: "bg-highlight/25 text-highlight-foreground",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
  confirmed: "bg-secondary text-secondary-foreground",
  shipped: "bg-secondary text-primary",
  delivered: "bg-success/15 text-success",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending approval",
  expired: "Expired",
  cancelled: "Cancelled",
  completed: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge className={cn("h-6 px-2.5", statusStyles[status])}>{label ?? statusLabels[status] ?? status}</Badge>;
}

export function EmptyState({ icon: Icon, title, text, cta }: { icon: LucideIcon; title: string; text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {cta && (
        <Link href={cta.href} className={buttonClass({ size: "lg", className: "mt-5 px-5" })}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading">
      <div className="h-9 w-56 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-muted" />
        <div className="h-24 rounded-2xl bg-muted" />
        <div className="h-24 rounded-2xl bg-muted" />
      </div>
      <div className="h-56 rounded-2xl bg-muted" />
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });
export const formatDate = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : "—");

export const categoryLabels: Record<string, string> = {
  hsc_1st: "HSC 1st Year",
  hsc_2nd: "HSC 2nd Year",
  admission: "Admission Batch",
};
