import { Quote, Star } from "lucide-react";
import { testimonials } from "@/data/home";
import { Section } from "@/components/layout/section";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export function SuccessStories() {
  return (
    <Section
      id="stories"
      className="bg-linear-to-b from-primary to-indigo-950 text-primary-foreground [&_.text-lead]:text-primary-foreground/80 [&_h2]:text-primary-foreground [&_p.uppercase]:text-highlight"
      eyebrow="Student success stories"
      title="Results that speak for themselves"
      description="Our students have achieved their dream results. Here are a few of their stories."
    >
      {/* Horizontal scroll on phones, grid on larger screens */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex w-[85%] shrink-0 snap-center flex-col rounded-2xl bg-white/[0.07] p-6 ring-1 ring-white/10 backdrop-blur sm:w-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-highlight text-highlight" aria-hidden />
                ))}
              </div>
              <Quote className="size-8 text-white/15" aria-hidden />
            </div>
            <blockquote className="mt-4 flex-1 leading-relaxed text-primary-foreground/90">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-highlight font-semibold text-highlight-foreground">
                {initials(t.name)}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{t.name}</p>
                <p className="truncate text-sm text-primary-foreground/70">{t.institution}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-highlight">
                {t.result}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
