import { Suspense } from "react";
import type { Metadata } from "next";
import { CalendarDays, GraduationCap, IdCard, Mail, Phone, UserRound } from "lucide-react";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardSkeleton, PageHeader, Panel, formatDate } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "My Profile" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  await requireUser("/dashboard/profile");
  const profile = await getCurrentProfile();

  const details = [
    { icon: IdCard, label: "Student ID", value: profile?.student_id },
    { icon: UserRound, label: "Full name", value: profile?.full_name },
    { icon: Mail, label: "Email", value: profile?.email },
    { icon: Phone, label: "Phone", value: profile?.phone },
    { icon: GraduationCap, label: "College", value: profile?.college },
    { icon: CalendarDays, label: "Member since", value: profile ? formatDate(profile.created_at) : null },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" action={<LogoutButton />} />
      <Panel>
        <dl className="grid gap-4 sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className={label === "Student ID" ? "truncate font-mono font-semibold tracking-wide" : "truncate font-medium"}>
                  {value || "—"}
                </dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm text-muted-foreground">Your Student ID is permanent. Contact us if any details need correcting.</p>
      </Panel>
    </div>
  );
}
