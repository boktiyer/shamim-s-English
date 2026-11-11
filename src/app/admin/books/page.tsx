import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText, Library } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getBooks, type AdminBook } from "@/lib/admin/data";
import { bookAssetUrl } from "@/lib/books";
import { formatTaka } from "@/lib/format";
import { ActionButton, AdminForm } from "@/components/admin/forms";
import { BookFileUploader } from "@/components/admin/book-file-uploader";
import { Checkbox, Field, TextArea, TextInput } from "@/components/admin/fields";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";
import { createBook, deleteBook, removeBookFile, updateBook } from "../actions";

export const metadata: Metadata = { title: "Books" };

function BookFields({ book }: { book?: AdminBook }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {book && <input type="hidden" name="id" value={book.id} />}
      <Field label="Title">
        <TextInput name="title" defaultValue={book?.title} required />
      </Field>
      <Field label="Subtitle">
        <TextInput name="subtitle" defaultValue={book?.subtitle ?? ""} />
      </Field>
      <Field label="Price (৳, 0 = free)">
        <TextInput name="price" type="number" min={0} defaultValue={book?.price ?? 0} />
      </Field>
      <Field label="Original price (optional)">
        <TextInput name="original_price" type="number" min={0} defaultValue={book?.original_price ?? ""} />
      </Field>
      <Field label="Pages">
        <TextInput name="pages" type="number" min={1} defaultValue={book?.pages ?? ""} />
      </Field>
      <Field label="Stock">
        <TextInput name="stock" type="number" min={0} defaultValue={book?.stock ?? 0} />
      </Field>
      <Field label="Cover image URL (optional, an uploaded cover is used first)" className="sm:col-span-2">
        <TextInput name="cover_url" type="url" defaultValue={book?.cover_url ?? ""} placeholder="https://…" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <TextArea name="description" defaultValue={book?.description ?? ""} />
      </Field>
      <input type="hidden" name="slug" value={book?.slug ?? ""} />
      <input type="hidden" name="author" value={book?.author ?? "Shamim Sir"} />
      <Checkbox name="is_published" label="Published (visible to visitors)" defaultChecked={book?.is_published ?? true} />
    </div>
  );
}

/** Cover image + sample PDF uploads, and a link to the public page. */
function BookFiles({ book }: { book: AdminBook }) {
  const cover = bookAssetUrl(book.cover_path) ?? book.cover_url;
  const sample = bookAssetUrl(book.sample_path);
  return (
    <div className="grid gap-5 sm:grid-cols-[6rem_1fr]">
      <div className="relative aspect-3/4 w-24 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- small admin preview
          <img src={cover} alt={`${book.title} cover`} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center p-2 text-center text-xs text-muted-foreground">No cover</span>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <BookFileUploader bookId={book.id} kind="cover" hasFile={Boolean(book.cover_path)} />
          {book.cover_path && <ActionButton action={removeBookFile} fields={{ id: book.id, kind: "cover" }} label="Remove cover" variant="outline" confirmText="Remove the cover image?" />}
        </div>
        <div className="space-y-2">
          <BookFileUploader bookId={book.id} kind="sample" hasFile={Boolean(book.sample_path)} />
          {sample && (
            <div className="flex flex-wrap items-center gap-2">
              <a href={sample} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <FileText className="size-4" aria-hidden /> Open sample
              </a>
              <ActionButton action={removeBookFile} fields={{ id: book.id, kind: "sample" }} label="Remove sample" variant="outline" confirmText="Remove the sample PDF?" />
            </div>
          )}
        </div>
        {book.is_published && (
          <Link href={`/books/${book.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline md:col-span-2">
            <ExternalLink className="size-4" aria-hidden /> View book page
          </Link>
        )}
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Books />
    </Suspense>
  );
}

async function Books() {
  await requireAdmin("/admin/books");
  const books = await getBooks();

  return (
    <div className="space-y-6">
      <PageHeader title="Books" description="Add books, upload covers and sample PDFs, and set stock. Orders are in Book Orders." />

      {books.length === 0 && <EmptyState icon={Library} title="No books yet" text="Add your first book below." />}
      {books.map((book) => (
        <Panel
          key={book.id}
          title={book.title}
          action={
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{Number(book.price) ? formatTaka(Number(book.price)) : "Free"}</span>
              <span className={book.stock ? "text-sm text-muted-foreground" : "text-sm font-medium text-destructive"}>{book.stock} in stock</span>
              <StatusBadge status={book.is_published ? "active" : "expired"} label={book.is_published ? "Published" : "Hidden"} />
            </div>
          }
        >
          <BookFiles book={book} />
          <details className="mt-5 border-t pt-4">
            <summary className="cursor-pointer text-sm font-medium text-primary">Edit book</summary>
            <div className="mt-4 space-y-4">
              <AdminForm action={updateBook} submitLabel="Save book">
                <BookFields book={book} />
              </AdminForm>
              <ActionButton action={deleteBook} fields={{ id: book.id }} label="Delete book" variant="destructive" confirmText="Delete this book?" />
            </div>
          </details>
        </Panel>
      ))}

      <Panel title="Add a book">
        <AdminForm action={createBook} submitLabel="Add book">
          <BookFields />
        </AdminForm>
      </Panel>
    </div>
  );
}
