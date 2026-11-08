import { cn } from "@/lib/utils";

/**
 * Centers content and adds consistent side padding on every screen size.
 * Wrap page sections in <Container> instead of repeating max-w/padding classes.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}
