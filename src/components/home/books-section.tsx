import Image from "next/image";
import Link from "next/link";
import { FileText, Gift, ShoppingCart } from "lucide-react";
import { siteConfig } from "@/config/site";
import { books, type Book } from "@/data/books";
import { formatTaka } from "@/lib/format";
import { buttonClass } from "@/lib/button-class";
import { Section } from "@/components/layout/section";
import { cn } from "@/lib/utils";

/** Generated book cover, used until real cover images are added. */
function BookCover({ book }: { book: Book }) {
  return (
    <div
      className={cn(
        "relative aspect-3/4 overflow-hidden bg-linear-to-br transition-transform duration-300 group-hover:-translate-y-2",
        book.cover
          ? "rounded-2xl shadow-xl ring-1 ring-black/5"
          : "rounded-l-sm rounded-r-lg shadow-[6px_8px_24px_-6px_rgb(0_0_0/0.35)] group-hover:-rotate-1",
        book.coverTone
      )}
    >
      {book.cover ? (
        <Image src={book.cover} alt={book.title} fill sizes="(min-width: 640px) 360px, 50vw" className="object-cover" />
      ) : (
        <div className="flex h-full flex-col p-4 text-white sm:p-5">
          {/* Spine shading */}
          <div aria-hidden className="absolute inset-y-0 left-0 w-3 bg-black/20" />
          <p className="pl-2 text-[0.65rem] font-semibold tracking-[0.2em] text-white/75 uppercase">
            {siteConfig.name}
          </p>
          <p className="mt-auto pl-2 font-heading text-lg leading-tight font-bold sm:text-xl">
            {book.title}
          </p>
          <p className="mt-2 pl-2 text-xs text-white/80">{book.subtitle}</p>
          <p className="mt-4 border-t border-white/25 pt-3 pl-2 text-xs font-medium">
            {siteConfig.teacherName}
          </p>
        </div>
      )}
    </div>
  );
}

export function BooksSection() {
  return (
    <Section
      id="books"
      eyebrow="Books by Shamim Sir"
      title="Study smarter with our books"
      description="Written by MMH Shamim Sir, free for all Shamim's English students."
    >
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-10">
        {books.map((book) => (
          <article key={book.id} className="group flex flex-col">
            <div className="px-2 sm:px-4">
              <BookCover book={book} />
            </div>
            <h3 className="mt-5 text-base leading-snug font-semibold sm:text-lg">
              {book.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{book.subtitle}</p>
            {book.pages && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="size-3.5" aria-hidden />
                {book.pages} pages
              </p>
            )}
            <div className="mt-3 mb-4 flex flex-wrap items-baseline gap-2">
              {book.free ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
                  <Gift className="size-4" aria-hidden />
                  Free for Students
                </span>
              ) : (
                <>
                  <span className="font-heading text-xl font-bold text-primary">
                    {formatTaka(book.price ?? 0)}
                  </span>
                  {book.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatTaka(book.originalPrice)}
                    </span>
                  )}
                </>
              )}
            </div>
            <Link
              href={`/register?book=${book.id}`}
              className={buttonClass({
                variant: "outline",
                size: "lg",
                className: "mt-auto w-full",
              })}
            >
              {book.free ? (
                <>
                  <Gift data-icon="inline-start" aria-hidden />
                  Get Your Free Copy
                </>
              ) : (
                <>
                  <ShoppingCart data-icon="inline-start" aria-hidden />
                  Order Now
                </>
              )}
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
