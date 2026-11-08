/** Dummy book data. Replace with real titles, prices and cover images later. */

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  pages: number;
  price: number;
  originalPrice?: number;
  /** Cover image path, e.g. "/images/books/grammar.jpg". Leave empty for a generated cover. */
  cover?: string;
  /** Tailwind gradient classes used for the generated cover */
  coverTone: string;
};

export const books: Book[] = [
  {
    id: "complete-grammar",
    title: "Complete English Grammar",
    subtitle: "For HSC & Admission",
    pages: 420,
    price: 450,
    originalPrice: 550,
    coverTone: "from-indigo-600 to-blue-500",
  },
  {
    id: "writing-guide",
    title: "Smart Writing Guide",
    subtitle: "Paragraph · Letter · Story",
    pages: 280,
    price: 350,
    originalPrice: 420,
    coverTone: "from-emerald-600 to-teal-500",
  },
  {
    id: "vocab-builder",
    title: "Vocabulary Builder",
    subtitle: "3000+ Words with Bangla",
    pages: 320,
    price: 380,
    coverTone: "from-amber-500 to-orange-500",
  },
  {
    id: "admission-question-bank",
    title: "Admission Question Bank",
    subtitle: "Solved Varsity Questions",
    pages: 512,
    price: 520,
    originalPrice: 650,
    coverTone: "from-rose-600 to-pink-500",
  },
];
