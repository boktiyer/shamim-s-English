import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Brand logo (public/images/logo.png, 323x137). Height is set with className, e.g. "h-11". */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-2", className)}>
      <Image
        src="/images/logo.png"
        alt=""
        width={323}
        height={137}
        priority
        className="h-full w-auto"
      />
      <span className="font-redaction text-xl leading-none font-bold whitespace-nowrap text-primary sm:text-2xl">
        {siteConfig.name}
      </span>
    </Link>
  );
}
