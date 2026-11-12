import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText, CircleCheck, FileDown, FileText, Gift, PackageX, ShoppingCart, Truck, UserRound } from "lucide-react";
import { activeManualMethods } from "@/config/payments";
import { getPublishedBookBySlug, type CatalogBook } from "@/lib/books";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/dal";
import { getBookOrders, getEnrollments } from "@/lib/dashboard/data";
import { hasAccess } from "@/lib/dashboard/progress";
import { formatTaka } from "@/lib/format";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";
import { BookCover } from "@/components/home/books-section";
import { DashboardSkeleton, Panel, StatusBadge, formatDate } from "@/components/dashboard/ui";
import { BookOrderForm } from "./order-form";

export const metadata: Metadata = { title: "Books" };

export default function BookPage({ params }: PageProps<"/books/[slug]">) {
  return (
    <Container className="py-10 sm:py-14">
      <Suspense fallback={<DashboardSkeleton />}>
        <BookDetails params={params} />
      </Suspense>
    </Container>
  );
}

async function BookDetails({ params }: Pick<PageProps<"/books/[slug]">, "params">) {
  const { slug } = await params;
  const book = await getPublishedBookBySlug(slug);
  if (!book) notFound();

  const price = Number(book.price);
  const free = price === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <article className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
        <div className="mx-auto w-full max-w-72 md:max-w-none">
          <BookCover book={{ title: book.title, subtitle: book.subtitle ?? "", cover: book.cover ?? undefined, coverTone: "from-brand-crimson to-brand-deep" }} />
        </div>

        <div>
          <p className="text-sm font-semibold text-primary">Books by Shamim Sir</p>
          <h1 className="mt-1 text-h1">{book.title}</h1>
          {book.subtitle && <p className="mt-2 text-lg text-muted-foreground">{book.subtitle}</p>}

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5"><UserRound className="size-4" aria-hidden /> {book.author}</li>
            {book.pages && <li className="flex items-center gap-1.5"><FileText className="size-4" aria-hidden /> {book.pages} pages</li>}
            <li className="flex items-center gap-1.5"><Truck className="size-4" aria-hidden /> Home delivery</li>
          </ul>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            {free ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 font-semibold text-success">
                <Gift className="size-4" aria-hidden /> Free for Students
              </span>
            ) : (
              <>
                <span className="font-heading text-3xl font-bold text-primary">{formatTaka(price)}</span>
                {book.original_price && (
                  <span className="text-muted-foreground line-through">{formatTaka(Number(book.original_price))}</span>
                )}
              </>
            )}
            {book.stock === 0 && <StatusBadge status="cancelled" label="Out of stock" />}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#order" className={buttonClass({ size: "lg", className: "h-11 px-6" })}>
              {free ? <Gift data-icon="inline-start" aria-hidden /> : <ShoppingCart data-icon="inline-start" aria-hidden />}
              {free ? "Get Your Free Copy" : "Buy Now"}
            </a>
            {book.sample && (
              <a href={book.sample} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "outline", size: "lg", className: "h-11 px-6" })}>
                <FileDown data-icon="inline-start" aria-hidden />
                Read sample (PDF)
              </a>
            )}
          </div>

          {book.description && (
            <div className="mt-8 border-t pt-6">
              <h2 className="flex items-center gap-2 text-h3"><BookOpenText className="size-5 text-primary" aria-hidden /> About this book</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-muted-foreground">{book.description}</p>
            </div>
          )}
        </div>
      </article>

      <section id="order" className="mx-auto max-w-3xl scroll-mt-24">
        <OrderSection book={book} />
      </section>
    </div>
  );
}

async function OrderSection({ book }: { book: CatalogBook }) {
  const user = await getCurrentUser();
  const free = Number(book.price) === 0;

  if (!user) {
    return (
      <Panel title={free ? "Get your free copy" : "Order this book"}>
        <p className="text-muted-foreground">Log in or create a free student account to order.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/login?next=/books/${book.slug}`} className={buttonClass({ size: "lg", className: "h-11 px-6" })}>
            Log in to order
          </Link>
          <Link href="/register" className={buttonClass({ variant: "outline", size: "lg", className: "h-11 px-6" })}>
            Create account
          </Link>
        </div>
      </Panel>
    );
  }

  const [orders, enrollments, profile] = await Promise.all([getBookOrders(), getEnrollments(), getCurrentProfile()]);
  const open = orders.find((o) => o.book_id === book.id && o.status === "pending");

  if (open) {
    return (
      <Panel title="Your order is being processed">
        <p className="flex items-start gap-2 text-muted-foreground">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <span>
            Order <span className="font-mono font-semibold text-foreground">{open.order_no}</span> ({open.quantity} {open.quantity > 1 ? "copies" : "copy"}
            {Number(open.total) > 0 && <>, {formatTaka(Number(open.total))}</>}) was placed on {formatDate(open.created_at)}. We will confirm it soon.
          </span>
        </p>
        <Link href="/dashboard/payments" className={buttonClass({ variant: "outline", size: "lg", className: "mt-5 h-11 px-6" })}>
          View my orders
        </Link>
      </Panel>
    );
  }

  if (book.stock < 1) {
    return (
      <Panel>
        <p className="flex items-center gap-2 font-semibold"><PackageX className="size-5 text-destructive" aria-hidden /> Out of stock</p>
        <p className="mt-2 text-muted-foreground">New copies are on the way. Please check back soon.</p>
      </Panel>
    );
  }

  if (free && !enrollments.some((e) => hasAccess(e))) {
    return (
      <Panel title="Free for enrolled students">
        <p className="text-muted-foreground">This book is free for students of Shamim&apos;s English. Enroll in a course, then come back to order your copy.</p>
        <Link href="/#courses" className={buttonClass({ size: "lg", className: "mt-5 h-11 px-6" })}>Explore Courses</Link>
      </Panel>
    );
  }

  return (
    <Panel title={free ? "Get your free copy" : "Order this book"}>
      <BookOrderForm
        slug={book.slug}
        userId={user.id}
        price={Number(book.price)}
        maxQuantity={book.stock}
        methods={activeManualMethods.map((m) => ({ ...m }))}
        defaults={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "" }}
      />
    </Panel>
  );
}
