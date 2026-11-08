import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type TeacherPhotoProps = {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

/**
 * Shows the teacher's photo, or a styled placeholder until a real photo
 * is added (set `teacher.photo` in src/data/home.ts).
 */
export function TeacherPhoto({ src, alt, className, priority }: TeacherPhotoProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-linear-to-br from-primary/90 via-primary to-indigo-900",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 480px, 90vw"
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (photo coming soon)`}
          className="flex h-full w-full flex-col items-center justify-end"
        >
          {/* Decorative rings */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.18),transparent_55%)]" />
          <UserRound
            className="relative size-3/4 translate-y-[12%] text-white/25"
            strokeWidth={1}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
