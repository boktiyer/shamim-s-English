import { cn } from "@/lib/utils";
import { Container } from "./container";

type SectionProps = React.ComponentProps<"section"> & {
  /** Optional small label above the title, e.g. "Our Courses" */
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Center (default) or left-align the heading */
  align?: "center" | "left";
  /** Extra content on the right of a left-aligned heading (e.g. a "View all" link) */
  action?: React.ReactNode;
  containerClassName?: string;
};

/**
 * A page section with consistent vertical spacing and an optional heading.
 */
export function Section({
  eyebrow,
  title,
  description,
  align = "center",
  action,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  const hasHeading = eyebrow || title || description;

  return (
    <section
      className={cn("scroll-mt-16 py-16 sm:py-20 lg:py-24", className)}
      {...props}
    >
      <Container className={containerClassName}>
        {hasHeading && (
          <div
            className={cn(
              "mb-10 sm:mb-12",
              align === "center"
                ? "mx-auto max-w-2xl text-center"
                : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            )}
          >
            <div className={cn(align === "left" && "max-w-2xl")}>
              {eyebrow && (
                <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
                  {eyebrow}
                </p>
              )}
              {title && <h2 className="text-h1">{title}</h2>}
              {description && <p className="mt-4 text-lead">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
