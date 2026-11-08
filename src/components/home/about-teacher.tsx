import Link from "next/link";
import { Award, CircleCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { heroStats, teacher } from "@/data/home";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";
import { TeacherPhoto } from "@/components/shared/teacher-photo";

export function AboutTeacher() {
  return (
    <section id="about" className="scroll-mt-16 bg-muted/40 py-16 sm:py-20 lg:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Photo */}
        <div className="relative mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
          <TeacherPhoto
            src={teacher.photo}
            alt={siteConfig.teacherName}
            className="aspect-square rounded-3xl shadow-xl"
          />
          <div className="absolute -right-3 -bottom-5 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg sm:-right-6">
            <Award className="size-8 text-highlight" aria-hidden />
            <div>
              <p className="font-heading text-2xl leading-none font-bold">12+</p>
              <p className="mt-1 text-xs text-primary-foreground/80">Years of teaching</p>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="lg:col-span-7">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
            About the teacher
          </p>
          <h2 className="text-h1">Meet {siteConfig.teacherName}</h2>
          <p className="mt-2 font-medium text-muted-foreground">{teacher.qualification}</p>

          <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
            {teacher.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {teacher.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm font-medium">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t pt-8">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
            <Link
              href="/#courses"
              className={buttonClass({ size: "lg", className: "h-11 px-6 sm:ml-auto" })}
            >
              Learn with Shamim Sir
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
