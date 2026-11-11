"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bell, CreditCard, FileText, LayoutDashboard, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export const dashboardNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  { title: "Notes & PDFs", href: "/dashboard/notes", icon: FileText },
  { title: "Notices", href: "/dashboard/notices", icon: Bell },
  { title: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { title: "Profile", href: "/dashboard/profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`) ||
    (href === "/dashboard/courses" && pathname.startsWith("/dashboard/learn"));
}

/**
 * Sidebar on large screens, a horizontally scrolling tab bar on phones/tablets.
 */
export function DashboardNav() {
  return <DashboardNavList pathname={usePathname()} />;
}

/** The link list itself; also used (without a highlight) as the Suspense fallback. */
export function DashboardNavList({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Dashboard">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {dashboardNav.map(({ title, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors lg:py-2.5",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground hover:bg-accent hover:text-foreground lg:border-transparent lg:bg-transparent"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
