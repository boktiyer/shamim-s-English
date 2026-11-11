import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Clock, CreditCard, ShieldCheck, Smartphone } from "lucide-react";
import { activeManualMethods } from "@/config/payments";
import { getPublishedCourseBySlug } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/dal";
import { getEnrollments, getPayments } from "@/lib/dashboard/data";
import { hasAccess } from "@/lib/dashboard/progress";
import { isSslcommerzConfigured, isSslcommerzSandbox } from "@/lib/payments/sslcommerz";
import { formatTaka } from "@/lib/format";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";
import { FormAlert } from "@/components/auth/form-parts";
import { DashboardSkeleton, Panel, categoryLabels, formatDate } from "@/components/dashboard/ui";
import { AdminForm } from "@/components/admin/forms";
import { ManualPaymentForm } from "./manual-payment-form";
import { startOnlinePayment } from "./actions";

export const metadata: Metadata = { title: "Enroll" };

const paymentMessages: Record<string, { type: "success" | "error" | "info"; text: string }> = {
  success: { type: "success", text: "Payment successful! Your course is now unlocked." },
  review: { type: "info", text: "Payment received. It needs a quick manual check, and your course will be unlocked after approval." },
  failed: { type: "error", text: "The payment was not completed. No money was taken, or it will be refunded by your bank. Please try again." },
  cancelled: { type: "info", text: "You cancelled the payment. You can try again any time." },
  error: { type: "error", text: "We could not confirm the payment. If money was deducted, contact us with your Transaction ID." },
};

export default function EnrollPage({ params, searchParams }: PageProps<"/enroll/[slug]">) {
  return (
    <Container className="py-10 sm:py-14">
      <Suspense fallback={<DashboardSkeleton />}>
        <Enroll params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Enroll({ params, searchParams }: Pick<PageProps<"/enroll/[slug]">, "params" | "searchParams">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();

  const user = await getCurrentUser();
  const notice = paymentMessages[String(query.payment ?? "")];
  const discount = course.original_price ? Math.round((1 - course.price / course.original_price) * 100) : 0;

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-5">
      {/* Course summary */}
      <aside className="lg:col-span-2">
        <Panel>
          <p className="text-sm font-semibold text-primary">{categoryLabels[course.category]}</p>
          <h1 className="mt-1 text-h2">{course.title}</h1>
          {course.subtitle && <p className="mt-2 text-muted-foreground">{course.subtitle}</p>}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-bold text-primary">{formatTaka(Number(course.price))}</span>
            {course.original_price && (
              <>
                <span className="text-muted-foreground line-through">{formatTaka(Number(course.original_price))}</span>
                <span className="text-sm font-medium text-success">{discount}% off</span>
              </>
            )}
          </div>
          {course.duration_weeks && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" aria-hidden /> {course.duration_weeks} weeks
            </p>
          )}
          {course.description && <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{course.description}</p>}
          <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            Your course unlocks only after the payment is verified.
          </p>
        </Panel>
      </aside>

      {/* Payment */}
      <div className="space-y-6 lg:col-span-3">
        {notice && <FormAlert type={notice.type}>{notice.text}</FormAlert>}
        {user ? <PaymentOptions courseId={course.id} slug={course.slug} price={Number(course.price)} userId={user.id} /> : <LoginFirst slug={course.slug} />}
      </div>
    </div>
  );
}

function LoginFirst({ slug }: { slug: string }) {
  return (
    <Panel title="Enroll in this course">
      <p className="text-muted-foreground">Log in or create a free student account to enroll.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/login?next=/enroll/${slug}`} className={buttonClass({ size: "lg", className: "h-11 px-6" })}>
          Log in to enroll
        </Link>
        <Link href="/register" className={buttonClass({ variant: "outline", size: "lg", className: "h-11 px-6" })}>
          Create account
        </Link>
      </div>
    </Panel>
  );
}

async function PaymentOptions({ courseId, slug, price, userId }: { courseId: string; slug: string; price: number; userId: string }) {
  const [enrollments, payments] = await Promise.all([getEnrollments(), getPayments()]);
  const enrollment = enrollments.find((e) => e.course?.id === courseId);

  if (enrollment && hasAccess(enrollment)) {
    return (
      <Panel>
        <p className="flex items-center gap-2 text-lg font-semibold text-success">
          <CircleCheck className="size-6" aria-hidden /> You are enrolled in this course
        </p>
        <Link href={`/dashboard/courses/${courseId}`} className={buttonClass({ size: "lg", className: "mt-5 h-11 px-6" })}>
          Go to course
        </Link>
      </Panel>
    );
  }

  const pending = payments.find(
    (p) => p.course?.id === courseId && p.status === "pending" && (p.method !== "sslcommerz" || p.gateway_status === "HIGH_RISK")
  );
  if (pending) {
    return (
      <Panel title="Payment under review">
        <p className="text-muted-foreground">
          We received your payment of <strong className="text-foreground">{formatTaka(Number(pending.amount))}</strong> on {formatDate(pending.created_at)}
          {pending.transaction_id && pending.method !== "sslcommerz" && (
            <>
              {" "}(TrxID <span className="font-mono">{pending.transaction_id}</span>)
            </>
          )}
          . Your course will unlock as soon as it is approved, usually within a few hours.
        </p>
        <Link href="/dashboard/payments" className={buttonClass({ variant: "outline", size: "lg", className: "mt-5 h-11 px-6" })}>
          View payment history
        </Link>
      </Panel>
    );
  }

  const online = isSslcommerzConfigured();
  return (
    <>
      {online && (
        <Panel title="Pay online">
          <p className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
            <CreditCard className="mt-0.5 size-4 shrink-0" aria-hidden />
            bKash, Nagad, Rocket, cards or internet banking through SSLCommerz. Your course unlocks instantly after payment.
          </p>
          {isSslcommerzSandbox() && <p className="mb-4 rounded-md bg-highlight/20 px-3 py-2 text-xs font-medium">Test mode (sandbox): no real money is charged.</p>}
          <AdminForm action={startOnlinePayment} submitLabel={`Pay ${formatTaka(price)} online`}>
            <input type="hidden" name="slug" value={slug} />
          </AdminForm>
        </Panel>
      )}

      {activeManualMethods.length > 0 && (
        <Panel title={online ? "Or pay manually with bKash / Nagad" : "Pay with bKash / Nagad"}>
          <ol className="mb-6 space-y-3 text-sm">
            {activeManualMethods.map((m) => (
              <li key={m.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <strong>{m.name}</strong> ({m.accountType}): {m.instruction} <strong className="text-primary">{formatTaka(price)}</strong> to{" "}
                  <span className="font-mono text-base font-bold">{m.number}</span>
                </span>
              </li>
            ))}
            <li className="px-1 text-muted-foreground">
              Then enter your number and the <strong>Transaction ID</strong> from the confirmation SMS, and upload a screenshot below.
            </li>
          </ol>
          <ManualPaymentForm slug={slug} userId={userId} methods={activeManualMethods.map((m) => ({ ...m }))} />
        </Panel>
      )}
    </>
  );
}
