import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { authNav } from "@/config/site";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";
import { StudentTotal } from "@/components/shared/student-total";

export function CtaBanner() {
  return (
    <section className="pb-16 sm:pb-20 lg:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-highlight px-6 py-12 text-center text-highlight-foreground sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -top-16 -left-16 size-56 rounded-full bg-white/25" />
          <div aria-hidden className="absolute -right-10 -bottom-20 size-64 rounded-full bg-white/20" />
          <div className="relative">
            <h2 className="text-h1">আজই শুরু করো তোমার প্রস্তুতি</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg opacity-85">
              Join <StudentTotal /> students who are already learning English the smart way.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={authNav.register.href}
                className={buttonClass({
                  size: "lg",
                  className: "h-12 bg-highlight-foreground px-6 text-base text-white hover:bg-highlight-foreground/90",
                })}
              >
                Join Now
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
              <Link
                href="/#courses"
                className={buttonClass({
                  variant: "outline",
                  size: "lg",
                  className: "h-12 border-highlight-foreground/30 bg-transparent px-6 text-base hover:bg-white/30",
                })}
              >
                Explore Courses
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
