import Link from "next/link";
import { BookOpen, MessageCircle, Trophy } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

/**
 * Phase 1 placeholder home page.
 * It only exists to preview the layout, colors and typography.
 * The real homepage will be designed in a later phase.
 */
const highlights = [
  {
    icon: MessageCircle,
    title: "Spoken English",
    description: "Speak fluently and confidently in everyday situations.",
  },
  {
    icon: BookOpen,
    title: "Grammar Made Simple",
    description: "Clear lessons that make English grammar easy to follow.",
  },
  {
    icon: Trophy,
    title: "IELTS Preparation",
    description: "Practice and strategies to reach your target band score.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-secondary/70 to-background">
        <Container className="py-20 text-center sm:py-28">
          <Badge className="mb-6 bg-highlight text-highlight-foreground">
            Learn English the right way
          </Badge>
          <h1 className="mx-auto max-w-3xl text-display">
            Speak English with <span className="text-primary">confidence</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lead">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/courses"
              className={buttonVariants({ size: "lg", className: "h-11 px-6" })}
            >
              Explore Courses
            </Link>
            <Link
              href="/about"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-11 px-6",
              })}
            >
              About Shamim
            </Link>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="What you'll learn"
        title="Everything you need to master English"
        description="Structured courses for every level, from beginner to advanced."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <span className="mb-2 flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <CardTitle className="text-h3">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
