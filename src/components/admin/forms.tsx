"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import type { FormState } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/form-parts";
import { cn } from "@/lib/utils";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Form wired to an admin server action: shows errors/success and a pending state. */
export function AdminForm({
  action,
  children,
  submitLabel,
  className,
  compact,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  /** Inline layout with a small button (for one-line forms) */
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={cn(compact ? "flex flex-wrap items-end gap-2" : "space-y-4", className)}>
      {!compact && state.error && <FormAlert type="error">{state.error}</FormAlert>}
      {!compact && state.success && <FormAlert type="success">{state.success}</FormAlert>}
      {children}
      <Button type="submit" size={compact ? "default" : "lg"} disabled={pending} className={compact ? "h-9 px-3" : "h-10 px-5"}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {submitLabel}
      </Button>
      {compact && state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

/** One-click action (approve, reject, delete…) with an optional confirm dialog. */
export function ActionButton({
  action,
  fields,
  label,
  confirmText,
  variant = "outline",
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  confirmText?: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {label}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
