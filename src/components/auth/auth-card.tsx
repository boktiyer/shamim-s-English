/** Heading + body + footer used by every auth page. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-h1">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {children}
      {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
