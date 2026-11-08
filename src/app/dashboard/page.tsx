import { Suspense } from "react";
import type { Metadata } from "next";
import { BadgeCheck, GraduationCap, IdCard, Mail, Phone } from "lucide-react";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";
import { Container } from "@/components/layout/container";
import { FormAlert } from "@/components/auth/form-parts";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = { title: "Student Dashboard" };

/**
 * Protected student dashboard (placeholder — the full dashboard comes in a later phase).
 * Protection is checked twice: in the proxy, and here on the server with requireUser().
 */
export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Container className="py-10 sm:py-14">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function DashboardContent({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  await requireUser("/dashboard");
  const [profile, params] = await Promise.all([getCurrentProfile(), searchParams]);

  const details = [
    { icon: IdCard, label: "Student ID", value: profile?.student_id },
    { icon: Mail, label: "Email", value: profile?.email },
    { icon: Phone, label: "Phone", value: profile?.phone },
    { icon: GraduationCap, label: "College", value: profile?.college },
  ];

  return (
    <div className="space-y-8">
      {params.message === "password_updated" && (
        <FormAlert type="success">Your password has been updated.</FormAlert>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Student Dashboard</p>
          <h1 className="mt-1 text-h1">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
          </h1>
        </div>
        <LogoutButton />
      </div>

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <h2 className="text-h3">Your profile</h2>
          <BadgeCheck className="size-5 text-success" aria-label="Verified" />
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="truncate font-medium">{value || "—"}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-sm text-muted-foreground">
        Your courses, progress and notices will appear here soon.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-label="Loading dashboard">
      <div className="h-10 w-64 rounded-lg bg-muted" />
      <div className="h-56 rounded-2xl bg-muted" />
    </div>
  );
}
