import Link from "next/link";
import { mainNav } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { Container } from "./container";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop & tablet navigation */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
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

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Log in
          </Link>
          <Link
            href="/courses"
            className={buttonVariants({ size: "lg", className: "px-4" })}
          >
            Start Learning
          </Link>
        </div>

        {/* Mobile navigation */}
        <MobileNav />
      </Container>
    </header>
  );
}
