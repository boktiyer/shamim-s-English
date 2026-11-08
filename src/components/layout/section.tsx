import { cn } from "@/lib/utils";
import { Container } from "./container";

type SectionProps = React.ComponentProps<"section"> & {
  /** Optional small label above the title, e.g. "Our Courses" */
  eyebrow?: string;
  title?: string;
  description?: string;
  containerClassName?: string;
};

/**
 * A page section with consistent vertical spacing and an optional heading.
 */
export function Section({
  eyebrow,
  title,
  description,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  const hasHeading = eyebrow || title || description;

  return (
    <section className={cn("py-16 sm:py-20 lg:py-24", className)} {...props}>
      <Container className={containerClassName}>
        {hasHeading && (
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-h1">{title}</h2>}
            {description && <p className="mt-4 text-lead">{description}</p>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
