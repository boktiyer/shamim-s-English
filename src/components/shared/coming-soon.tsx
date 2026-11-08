import Link from "next/link";
import { Construction } from "lucide-react";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";

/** Temporary page body for features that are planned but not built yet. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Construction className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-h1">{title}</h1>
      <p className="mt-3 max-w-md text-lead">{description}</p>
      <Link href="/" className={buttonClass({ size: "lg", className: "mt-8 h-11 px-6" })}>
        Back to Home
      </Link>
    </Container>
  );
}
