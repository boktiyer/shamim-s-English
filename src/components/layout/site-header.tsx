import { Suspense } from "react";
import Link from "next/link";
import { mainNav } from "@/config/site";
import { Logo } from "@/components/shared/logo";
import { Container } from "./container";
import { HeaderActions, HeaderActionsFallback } from "./header-actions";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo className="h-10 sm:h-12" />

        {/* Desktop navigation (large screens) */}
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Login/Register or Dashboard/Logout, depending on the session */}
        <Suspense fallback={<HeaderActionsFallback />}>
          <HeaderActions />
        </Suspense>
      </Container>
    </header>
  );
}
