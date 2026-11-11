import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { authNav } from "@/config/site";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/dal";
import { buttonClass } from "@/lib/button-class";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNav } from "./mobile-nav";

/** Right side of the header. Reads the session, so it renders behind Suspense. */
export async function HeaderActions() {
  const user = await getCurrentUser();
  const isAdmin = user ? (await getCurrentProfile())?.role === "admin" : false;
  return <HeaderActionsView isLoggedIn={Boolean(user)} isAdmin={isAdmin} />;
}

/** Shown while the session is being checked (keeps the layout from jumping). */
export function HeaderActionsFallback() {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden h-9 w-40 animate-pulse rounded-lg bg-muted sm:block" aria-hidden />
      <MobileNav isLoggedIn={false} />
    </div>
  );
}

function HeaderActionsView({ isLoggedIn, isAdmin = false }: { isLoggedIn: boolean; isAdmin?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {isLoggedIn ? (
        <>
          <Link
            href={isAdmin ? "/admin" : "/dashboard"}
            className={buttonClass({ size: "lg", className: "hidden px-4 sm:inline-flex" })}
          >
            <LayoutDashboard data-icon="inline-start" aria-hidden />
            {isAdmin ? "Admin Panel" : "Dashboard"}
          </Link>
          <LogoutButton className="hidden sm:inline-flex" />
        </>
      ) : (
        <>
          <Link
            href={authNav.login.href}
            className={buttonClass({ variant: "ghost", size: "lg", className: "hidden px-3 sm:inline-flex" })}
          >
            {authNav.login.title}
          </Link>
          <Link
            href={authNav.register.href}
            className={buttonClass({ size: "lg", className: "hidden px-4 sm:inline-flex" })}
          >
            {authNav.register.title}
          </Link>
        </>
      )}
      <MobileNav isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
    </div>
  );
}
