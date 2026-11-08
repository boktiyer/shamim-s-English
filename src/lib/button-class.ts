import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Button styles for links (<Link className={buttonClass({ ... })}>).
 *
 * Use this instead of calling buttonVariants() with a className directly:
 * this merges your classes properly, so e.g. "h-12" or "hidden" override
 * the defaults instead of conflicting with them.
 */
export function buttonClass({
  className,
  ...variants
}: Parameters<typeof buttonVariants>[0] = {}) {
  return cn(buttonVariants(variants), className);
}
