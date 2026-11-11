import Image from "next/image";
import { Trophy } from "lucide-react";
import { achievements } from "@/data/achievements";
import { Section } from "@/components/layout/section";
import { cn } from "@/lib/utils";

/**
 * Photo gallery of student results and awards.
 * Layout: first photo large (2x2), the rest in a square grid.
 */
export function StudentAchievements() {
  if (!achievements.length) return null;

  return (
    <Section
      id="achievements"
      eyebrow="Student Achievements"
      title="Our students, our pride"
      description="Real results from Shamim's English students: top ranks, outstanding scores and award-winning effort."
    >
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {achievements.map((a, i) => {
          const featured = i === 0;
          return (
            <li key={a.image} className={cn(featured && "col-span-2 lg:row-span-2")}>
              <a
                href={a.image}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-black/5"
              >
                <Image
                  src={a.image}
                  alt={`${a.title}${a.subtitle ? ` — ${a.subtitle}` : ""}`}
                  fill
                  priority={featured}
                  sizes={featured ? "(min-width: 1024px) 600px, 100vw" : "(min-width: 1024px) 300px, 50vw"}
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                {a.tag && !a.poster && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-highlight px-2.5 py-1 text-xs font-semibold text-highlight-foreground shadow">
                    <Trophy className="size-3" aria-hidden />
                    {a.tag}
                  </span>
                )}
                {!a.poster && (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white sm:p-4 sm:pt-12">
                  <p className={cn("font-semibold leading-snug", featured ? "text-base sm:text-xl" : "text-sm sm:text-base")}>
                    {a.title}
                  </p>
                  {a.subtitle && (
                    <p className={cn("mt-0.5 text-white/80", featured ? "text-xs sm:text-sm" : "hidden text-xs sm:block")}>
                      {a.subtitle}
                    </p>
                  )}
                </div>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
