import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { footerNav, siteConfig } from "@/config/site";
import { Logo } from "@/components/shared/logo";
import { FacebookGroupButton, SocialLinks } from "@/components/shared/social-icons";
import { Container } from "./container";

/** Cached so the page can still be prerendered (required by Cache Components). */
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

const { contact } = siteConfig;

const contactItems = [
  { icon: Phone, label: contact.phone, href: `tel:+88${contact.phone.replace(/\D/g, "")}` },
  { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
  { icon: MapPin, label: contact.address },
  { icon: Clock, label: contact.hours },
].filter((item) => item.label);

export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-16 border-t bg-muted/40">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-12">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-4">
          <Logo className="h-14" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {siteConfig.description}
          </p>
          <SocialLinks className="mt-6" />
          <FacebookGroupButton className="mt-4" />
        </div>

        {/* Link groups */}
        {footerNav.map((group) => (
          <div key={group.title} className="lg:col-span-2">
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

        {/* Contact */}
        <div className="col-span-2 lg:col-span-4">
          <h3 className="text-sm font-semibold">Contact Us</h3>
          <ul className="mt-4 space-y-3">
            {contactItems.map(({ icon: Icon, label, href }) => (
              <li key={label} className="flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {href ? (
                  <a
                    href={href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t">
        <Container className="flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © <CopyrightYear /> {siteConfig.name}. All rights reserved.
          </p>
          <p>
            Developed by{" "}
            <a
              href="https://boktiyer-hossen-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Boktiyer Hossen
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
