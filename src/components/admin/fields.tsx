import { cn } from "@/lib/utils";

/** Plain form fields for admin forms (same look as the shadcn Input). */

const control =
  "w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 py-2", className)} {...props} />;
}

export function Select({
  options,
  className,
  ...props
}: React.ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <select className={cn(control, "h-10", className)} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ label, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" className="size-4 accent-primary" {...props} />
      {label}
    </label>
  );
}

export const categoryOptions = [
  { value: "hsc_1st", label: "HSC 1st Year" },
  { value: "hsc_2nd", label: "HSC 2nd Year" },
  { value: "admission", label: "Admission Batch" },
];

export const courseStatusOptions = [
  { value: "draft", label: "Draft (hidden)" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const lessonTypeOptions = [
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDF / Notes" },
  { value: "text", label: "Text" },
  { value: "quiz", label: "Quiz" },
  { value: "live", label: "Live class" },
];
