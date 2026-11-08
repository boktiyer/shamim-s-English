import Link from "next/link";
import { authNav, mainNav } from "@/config/site";
import { buttonClass } from "@/lib/button-class";
import { Logo } from "@/components/shared/logo";
import { Container } from "./container";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

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

        <div className="flex items-center gap-2">
          <Link
            href={authNav.login.href}
            className={buttonClass({
              variant: "ghost",
              size: "lg",
              className: "hidden px-3 sm:inline-flex",
            })}
          >
            {authNav.login.title}
          </Link>
          <Link
            href={authNav.register.href}
            className={buttonClass({
              size: "lg",
              className: "hidden px-4 sm:inline-flex",
            })}
          >
            {authNav.register.title}
          </Link>

          {/* Phone & tablet navigation */}
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
