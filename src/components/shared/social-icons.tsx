import {
  siFacebook,
  siInstagram,
  siTelegram,
  siWhatsapp,
  siYoutube,
  type SimpleIcon,
} from "simple-icons";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

function BrandIcon({ icon, className }: { icon: SimpleIcon; className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path d={icon.path} />
    </svg>
  );
}

const socialLinks = [
  { label: "Facebook", href: siteConfig.social.facebook, icon: siFacebook },
  { label: "YouTube", href: siteConfig.social.youtube, icon: siYoutube },
  { label: "Instagram", href: siteConfig.social.instagram, icon: siInstagram },
  { label: "WhatsApp", href: siteConfig.social.whatsapp, icon: siWhatsapp },
  { label: "Telegram", href: siteConfig.social.telegram, icon: siTelegram },
].filter((l) => l.href);

/** "Join our Facebook Group" button (hidden when no group link is set). */
export function FacebookGroupButton({ className }: { className?: string }) {
  if (!siteConfig.social.facebookGroup) return null;
  return (
    <a
      href={siteConfig.social.facebookGroup}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-5 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-[#166FE5]",
        className
      )}
    >
      <BrandIcon icon={siFacebook} className="size-5" />
      Join our Facebook Group
    </a>
  );
}

/** Row of round social media buttons. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {socialLinks.map(({ label, href, icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <BrandIcon icon={icon} />
          </a>
        </li>
      ))}
    </ul>
  );
}
