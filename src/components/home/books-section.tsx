import Image from "next/image";
import Link from "next/link";
import { FileText, ShoppingCart } from "lucide-react";
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
        "relative aspect-3/4 overflow-hidden rounded-r-lg rounded-l-sm bg-linear-to-br shadow-[6px_8px_24px_-6px_rgb(0_0_0/0.35)] transition-transform duration-300 group-hover:-translate-y-2 group-hover:-rotate-1",
        book.coverTone
      )}
    >
      {book.cover ? (
        <Image src={book.cover} alt={book.title} fill sizes="240px" className="object-cover" />
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
      align="left"
      eyebrow="Books by Shamim Sir"
      title="Study smarter with our books"
      description="Clear rules, Bangla explanations and hundreds of practice questions. Delivered anywhere in Bangladesh."
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
        {books.map((book) => (
          <article key={book.id} className="group flex flex-col">
            <div className="px-2 sm:px-4">
              <BookCover book={book} />
            </div>
            <h3 className="mt-5 text-base leading-snug font-semibold sm:text-lg">
              {book.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="size-3.5" aria-hidden />
              {book.pages} pages
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span className="font-heading text-xl font-bold text-primary">
                {formatTaka(book.price)}
              </span>
              {book.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatTaka(book.originalPrice)}
                </span>
              )}
            </div>
            <Link
              href={`/register?book=${book.id}`}
              className={buttonClass({
                variant: "outline",
                size: "lg",
                className: "mt-4 w-full",
              })}
            >
              <ShoppingCart data-icon="inline-start" aria-hidden />
              Order Now
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
