import "@fontsource/redaction-10/700.css";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles, Trophy } from "lucide-react";
import { authNav, siteConfig } from "@/config/site";
import { heroStats, teacher } from "@/data/home";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";
import { TeacherPhoto } from "@/components/shared/teacher-photo";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-secondary/80 via-background to-background">
      {/* Soft background shapes */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/2 -left-32 size-80 rounded-full bg-highlight/20 blur-3xl" />

      <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* Text */}
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-4 py-1.5 text-sm font-medium text-primary shadow-xs">
            <Sparkles className="size-4 text-highlight" aria-hidden />
            HSC ও ভর্তি পরীক্ষার সেরা ইংরেজি প্রস্তুতি
          </p>

          <h1 className="mt-6 font-redaction text-display">
            Master English with{" "}
            <span className="relative whitespace-nowrap text-primary">
              Shamim&apos;s English
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full text-highlight"
              >
                <path d="M2 9c60-6 180-8 296-3" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lead lg:mx-0">
            Simple explanations, smart shortcuts and exam-focused practice for
            HSC 1st Year, HSC 2nd Year and university admission. Learn from{" "}
            <strong className="font-semibold text-foreground">
              {siteConfig.teacherName}
            </strong>{" "}
            and study with confidence.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/#courses"
              className={buttonClass({ size: "lg", className: "h-12 px-6 text-base" })}
            >
              Explore Courses
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
            <Link
              href={authNav.register.href}
              className={buttonClass({
                variant: "outline",
                size: "lg",
                className: "h-12 px-6 text-base",
              })}
            >
              Join Now
            </Link>
          </div>

          <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4 lg:mx-0">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-2xl font-bold sm:text-3xl">
                  {stat.value}
                </dd>
                <dd className="text-sm text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Teacher photo */}
        <div className="relative mx-auto w-full max-w-sm sm:max-w-md">
          <div aria-hidden className="absolute inset-4 -z-0 rotate-6 rounded-[2rem] bg-highlight/40" />
          <TeacherPhoto
            src={teacher.heroPhoto ?? teacher.photo}
            alt={siteConfig.teacherName}
            priority
            className="relative aspect-square rounded-[2rem] shadow-2xl shadow-primary/20 ring-4 ring-white/70"
          />

          {/* Name card */}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-background/95 p-4 shadow-lg backdrop-blur sm:inset-x-6 sm:bottom-6">
            <p className="flex items-center gap-1.5 font-heading text-xl font-bold">
              {siteConfig.teacherName}
              <BadgeCheck className="size-5 text-primary" aria-label="Verified teacher" />
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {teacher.qualification}
            </p>
          </div>

          {/* Floating result badge */}
          <div className="absolute -top-3 -left-3 flex items-center gap-3 rounded-2xl bg-background p-3 shadow-lg sm:-left-8 sm:top-10">
            <span className="flex size-10 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
              <Trophy className="size-5" aria-hidden />
            </span>
            <div className="pr-1">
              <p className="font-heading text-lg leading-none font-bold">1,000+</p>
              <p className="mt-1 text-xs text-muted-foreground">GPA 5 in English</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
