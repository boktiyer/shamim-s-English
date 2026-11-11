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
};

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
