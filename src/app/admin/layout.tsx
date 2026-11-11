import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { DashboardNav, DashboardNavList } from "@/components/dashboard/dashboard-nav";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Admin shell. Every admin page checks requireAdmin() on the server
 * inside its own Suspense boundary; the shell itself shows no data.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30">
      <Container className="grid gap-6 py-6 sm:py-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:block">
            Admin Panel
          </p>
          <Suspense fallback={<DashboardNavList pathname="" variant="admin" />}>
            <DashboardNav variant="admin" />
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
