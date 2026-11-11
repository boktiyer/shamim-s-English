import { Suspense } from "react";
import type { Metadata } from "next";
import { Library } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getBooks, type AdminBook } from "@/lib/admin/data";
import { formatTaka } from "@/lib/format";
import { ActionButton, AdminForm } from "@/components/admin/forms";
import { Checkbox, Field, TextArea, TextInput } from "@/components/admin/fields";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";
import { createBook, deleteBook, updateBook } from "../actions";

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
      <Field label="Cover image URL" className="sm:col-span-2">
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
      <PageHeader title="Books" description="Add, edit or hide books." />

      {books.length === 0 && <EmptyState icon={Library} title="No books yet" text="Add your first book below." />}
      {books.map((book) => (
        <Panel
          key={book.id}
          title={book.title}
          action={
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{Number(book.price) ? formatTaka(Number(book.price)) : "Free"}</span>
              <StatusBadge status={book.is_published ? "active" : "expired"} label={book.is_published ? "Published" : "Hidden"} />
            </div>
          }
        >
          <details>
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
