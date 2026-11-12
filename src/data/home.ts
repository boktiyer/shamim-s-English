/** Dummy homepage content: stats, features, testimonials and FAQs. */

export const heroStats = [
  { value: "1,500+", label: "Students" },
  { value: "5+", label: "Years Teaching" },
  { value: "4.9★", label: "Average Rating" },
];

export const teacher = {
  name: "MMH Shamim",
  title: "Shamim Sir (CU)",
  photo: "/images/shamim-sir.jpg" as string | undefined,
  /** Photo in the homepage hero (square) */
  heroPhoto: "/images/shamim-sir-hero.png" as string | undefined,
  qualification: "Ranked in DU B, CU B (English), CU A & GST · Co-Writer, Aspect Series",
  bio: [
    "Shamim Sir has been teaching English to HSC and admission candidates for over 5 years. His classes turn difficult grammar rules into simple, memorable patterns that students can use in the exam hall.",
    "More than 1,000 of his students have achieved GPA 5 in English and secured seats at top public universities, medical colleges and engineering institutes across Bangladesh.",
  ],
  highlights: [
    "5+ years of classroom & online teaching",
    "Co-Writer, Aspect Series",
    "Ranked in DU B, CU B (English), CU A & GST",
    "Specialist in HSC board & varsity admission English",
    "1,000+ GPA 5 and admission success stories",
  ],
};

export const features = [
  {
    icon: "Video",
    title: "Live & Recorded Classes",
    description: "Join live classes or watch recordings anytime, as many times as you need.",
  },
  {
    icon: "PenLine",
    title: "Easy Bangla Explanations",
    description: "Every topic explained in simple Bangla, so concepts are clear from day one.",
  },
  {
    icon: "ClipboardCheck",
    title: "Weekly Exams",
    description: "Regular model tests with feedback show exactly where you need to improve.",
  },
  {
    icon: "FileText",
    title: "Lecture Notes & PDFs",
    description: "Well-organised notes and practice sheets for every chapter.",
  },
  {
    icon: "MessageCircle",
    title: "Doubt Solving Support",
    description: "Ask questions in the private group and get answers quickly.",
  },
  {
    icon: "Target",
    title: "Exam-Focused Syllabus",
    description: "Built around NCTB board and university question patterns.",
  },
] as const;

export type Testimonial = {
  name: string;
  institution: string;
  result: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Nusrat Jahan",
    institution: "Chittagong College",
    result: "GPA 5.00, HSC 2025",
    quote:
      "Grammar used to scare me. Shamim Sir's shortcuts made everything easy and I got A+ in both English papers.",
  },
  {
    name: "Tanvir Ahmed",
    institution: "University of Dhaka",
    result: "DU 'B' Unit, Merit 312",
    quote:
      "The admission batch covered exactly what came in the exam. The vocabulary sessions were a game changer for me.",
  },
  {
    name: "Sadia Islam",
    institution: "Chittagong Medical College",
    result: "Medical Admission 2025",
    quote:
      "Weekly model tests kept me on track. I could finish the English part quickly and focus on the rest of the paper.",
  },
  {
    name: "Rahim Uddin",
    institution: "BUET",
    result: "Engineering Admission 2024",
    quote:
      "Clear explanations, great notes and a teacher who actually cares. Highly recommended for every HSC student.",
  },
  {
    name: "Farhana Akter",
    institution: "Hazera-Taju Degree College",
    result: "GPA 5.00, HSC 2024",
    quote:
      "I joined in my 1st year and it built my foundation. By the final exam I was fully confident in writing.",
  },
  {
    name: "Mahmudul Hasan",
    institution: "University of Chittagong",
    result: "CU 'A' Unit, Merit 98",
    quote:
      "Sir's question bank book and the live solving classes were all I needed for the English section.",
  },
];

export const faqs = [
  {
    question: "How do the online classes work?",
    answer:
      "After enrolling, you get access to live classes, recorded lectures, PDF notes and exams from your student dashboard. You can join from your phone, tablet or computer.",
  },
  {
    question: "Can I watch the class later if I miss a live session?",
    answer:
      "Yes. Every live class is recorded and uploaded to your course, so you can watch it any time and as many times as you like.",
  },
  {
    question: "How can I pay for a course?",
    answer:
      "You can pay with bKash, Nagad, Rocket or a bank card. Your course unlocks right after the payment is confirmed.",
  },
  {
    question: "Are the classes in Bangla or English?",
    answer:
      "Classes are taught mainly in Bangla, with English examples and practice, so every student can follow easily.",
  },
  {
    question: "How do I get the printed books?",
    answer:
      "Our books are free for all Shamim's English students. Register, then contact us to get your copy.",
  },
  {
    question: "Who can I contact if I need help?",
    answer:
      "Call or WhatsApp our support number, or send us an email. Our team replies within working hours, Saturday to Thursday.",
  },
];
