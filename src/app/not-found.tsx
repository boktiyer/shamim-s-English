import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <SearchX className="size-12 text-primary" aria-hidden />
      <h1 className="mt-4 text-h1">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This page doesn&apos;t exist, or the course or book is no longer available.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass({ size: "lg", className: "h-11 px-6" })}>Go to homepage</Link>
        <Link href="/#courses" className={buttonClass({ variant: "outline", size: "lg", className: "h-11 px-6" })}>See courses</Link>
      </div>
    </Container>
  );
}
