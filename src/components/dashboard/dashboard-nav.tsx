"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, BookOpen, Bell, CreditCard, FileText, GraduationCap, LayoutDashboard, Library, Package, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const dashboardNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  { title: "Notes & PDFs", href: "/dashboard/notes", icon: FileText },
  { title: "Notices", href: "/dashboard/notices", icon: Bell },
  { title: "Payments & Orders", href: "/dashboard/payments", icon: CreditCard },
  { title: "Profile", href: "/dashboard/profile", icon: UserRound },
];

export const adminNav = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Approvals", href: "/admin/payments", icon: BadgeCheck },
  { title: "Enrollments", href: "/admin/enrollments", icon: GraduationCap },
  { title: "Students", href: "/admin/students", icon: Users },
  { title: "Courses", href: "/admin/courses", icon: BookOpen },
  { title: "Books", href: "/admin/books", icon: Library },
  { title: "Book Orders", href: "/admin/orders", icon: Package },
  { title: "Notices", href: "/admin/notices", icon: Bell },
];

const navs = { student: dashboardNav, admin: adminNav };
type NavVariant = keyof typeof navs;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  if (href === "/admin/courses" && pathname.startsWith("/admin/lessons")) return true;
  return pathname === href || pathname.startsWith(`${href}/`) ||
    (href === "/dashboard/courses" && pathname.startsWith("/dashboard/learn"));
}

/**
 * Sidebar on large screens, a horizontally scrolling tab bar on phones/tablets.
 */
export function DashboardNav({ variant = "student" }: { variant?: NavVariant }) {
  return <DashboardNavList pathname={usePathname()} variant={variant} />;
}

/** The link list itself; also used (without a highlight) as the Suspense fallback. */
export function DashboardNavList({ pathname, variant = "student" }: { pathname: string; variant?: NavVariant }) {
  return (
    <nav aria-label={variant === "admin" ? "Admin" : "Dashboard"}>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {navs[variant].map(({ title, href, icon: Icon }) => {
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
