import { Container } from "@/components/layout/container";
import { Suspense } from "react";
import { DashboardNav, DashboardNavList } from "@/components/dashboard/dashboard-nav";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Dashboard shell: sidebar (desktop) / tab bar (mobile) + page content.
 * No session read here, so the shell renders instantly; each page checks
 * the session on the server (requireUser) behind its own Suspense boundary.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30">
      <Container className="grid gap-6 py-6 sm:py-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:block">
            Student Dashboard
          </p>
          <Suspense fallback={<DashboardNavList pathname="" />}>
            <DashboardNav />
          </Suspense>
          <div className="mt-6 hidden border-t pt-6 lg:block">
            <LogoutButton fullWidth />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  );
}
