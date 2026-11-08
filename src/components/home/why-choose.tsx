import {
  ClipboardCheck,
  FileText,
  MessageCircle,
  PenLine,
  Target,
  Video,
} from "lucide-react";
import { features } from "@/data/home";
import { Section } from "@/components/layout/section";

const icons = { ClipboardCheck, FileText, MessageCircle, PenLine, Target, Video };

export function WhyChoose() {
  return (
    <Section
      id="why"
      eyebrow="Why Shamim's English"
      title="Everything you need to succeed"
      description="A complete learning system, not just videos, designed to take you from confused to confident."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = icons[feature.icon];
          return (
            <div
              key={feature.title}
              className="rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
