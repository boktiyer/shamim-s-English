import { CircleCheck, Quote } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/layout/container";

const perks = [
  "Live & recorded classes from Shamim Sir",
  "Lecture notes, PDFs and weekly exams",
  "Track your progress lesson by lesson",
];

/** Two-column layout for login / register / password pages. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-linear-to-b from-secondary/60 to-background">
      <Container className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl shadow-primary/5 lg:grid-cols-5">
          {/* Brand panel (desktop only) */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-primary-foreground lg:col-span-2 lg:flex">
            <div aria-hidden className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10" />
            <div aria-hidden className="absolute -bottom-24 -left-16 size-72 rounded-full bg-highlight/20" />

            <div className="relative">
              <p className="text-sm font-semibold tracking-wide text-highlight uppercase">
                {siteConfig.name}
              </p>
              <h2 className="mt-3 text-h2 text-primary-foreground">
                তোমার ইংরেজি শেখার যাত্রা শুরু হোক এখানে
              </h2>
              <ul className="mt-8 space-y-4">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-highlight" aria-hidden />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <figure className="relative mt-10 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
              <Quote className="size-6 text-highlight" aria-hidden />
              <blockquote className="mt-2 text-sm leading-relaxed text-primary-foreground/90">
                Shamim Sir&apos;s classes made grammar easy. I got A+ in both English papers.
              </blockquote>
              <figcaption className="mt-3 text-xs font-medium text-primary-foreground/70">
                Nusrat Jahan · GPA 5.00, HSC 2025
              </figcaption>
            </figure>
          </aside>

          {/* Form */}
          <div className="flex items-center p-6 sm:p-10 lg:col-span-3 lg:p-12">{children}</div>
        </div>
      </Container>
    </div>
  );
}
