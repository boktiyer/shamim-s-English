import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-heading text-lg font-bold tracking-tight",
        className
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      <span>{siteConfig.name}</span>
    </Link>
  );
}
