import Link from "next/link";
import { footerNav, siteConfig } from "@/config/site";
import { Logo } from "@/components/shared/logo";
import { Container } from "./container";

/** Cached so the page can still be prerendered (required by Cache Components). */
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>

        {footerNav.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold">{group.title}</h3>
            <ul className="mt-4 space-y-3">
              {group.items.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t">
        <Container className="py-6 text-center text-sm text-muted-foreground sm:text-left">
          © <CopyrightYear /> {siteConfig.name}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}
