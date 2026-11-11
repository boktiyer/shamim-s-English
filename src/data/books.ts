/** Books by Shamim Sir shown on the homepage. */

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  pages?: number;
  /** Leave empty when the book is free for students */
  price?: number;
  originalPrice?: number;
  /** true = shown as "Free for Students" instead of a price */
  free?: boolean;
  /** Cover image path, e.g. "/images/books/grammar.jpg". Leave empty for a generated cover. */
  cover?: string;
  /** Tailwind gradient classes used for the generated cover */
  coverTone: string;
  /** Details page link (books from the database) */
  href?: string;
};

const tones = ["from-blue-800 to-indigo-900", "from-purple-700 to-violet-900", "from-emerald-700 to-teal-900", "from-rose-700 to-red-900"];

/** Turns a published database book into the homepage card shape. */
export function catalogToBook(
  b: { slug: string; title: string; subtitle: string | null; pages: number | null; price: number; original_price: number | null; cover: string | null },
  i: number
): Book {
  const price = Number(b.price);
  return {
    id: b.slug,
    title: b.title,
    subtitle: b.subtitle ?? "",
    pages: b.pages ?? undefined,
    price,
    originalPrice: b.original_price ? Number(b.original_price) : undefined,
    free: price === 0,
    cover: b.cover ?? undefined,
    coverTone: tones[i % tones.length],
    href: `/books/${b.slug}`,
  };
}

export const books: Book[] = [
  {
    id: "secret-weapon",
    title: "Secret Weapon",
    subtitle: "English Mastery for University Admission",
    free: true,
    cover: "/images/books/secret-weapon.jpg",
    coverTone: "from-blue-800 to-indigo-900",
  },
  {
    id: "smart-question-bank",
    title: "Smart Question Bank",
    subtitle: "BCS · Dental · Medical",
    free: true,
    cover: "/images/books/smart-question-bank.jpg",
    coverTone: "from-purple-700 to-violet-900",
  },
];
