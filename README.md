# Shamim's English

An online English learning platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui** and **Supabase**.

> **Status:** Phase 1 — project foundation (structure, design system, layout, Supabase wiring).

---

## Getting started

You need **Node.js 20 or newer** installed.

```bash
# 1. Install the packages
npm install

# 2. Create your local settings file
cp .env.example .env.local      # then open .env.local and paste your Supabase keys

# 3. Start the development server
npm run dev
```

Open <http://localhost:3000> in your browser.

The site runs without Supabase keys. Login and database features need them.

### Useful commands

| Command         | What it does                                 |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start the site locally with live reload      |
| `npm run build` | Build the production version (checks errors) |
| `npm run start` | Run the production build                     |
| `npm run lint`  | Check the code for common mistakes           |

---

## Folder structure

```
src/
├── app/                    # Pages (each folder = a URL)
│   ├── layout.tsx          # Wraps every page: header, footer, fonts
│   ├── page.tsx            # Home page (placeholder for now)
│   └── globals.css         # Colors, fonts, typography — the design system
├── components/
│   ├── ui/                 # shadcn/ui building blocks (Button, Card, Sheet…)
│   ├── layout/             # Header, footer, mobile menu, Container, Section
│   └── shared/             # Reusable site pieces (Logo, …)
├── config/
│   └── site.ts             # Site name, description and menu links
├── lib/
│   ├── fonts.ts            # Font setup
│   ├── utils.ts            # cn() helper for combining CSS classes
│   └── supabase/           # Supabase clients (browser, server, proxy)
└── proxy.ts                # Runs before each request (keeps logins fresh)
```

### Editing homepage content

The homepage text, courses, books, testimonials and FAQs are dummy data. Edit them here:

| What                                   | File                                         |
| -------------------------------------- | -------------------------------------------- |
| Courses & categories                   | `src/data/courses.ts`                        |
| Books                                  | `src/data/books.ts`                          |
| Teacher bio, stats, features, reviews, FAQ | `src/data/home.ts`                       |
| Phone, email, address, social links    | `src/config/site.ts`                         |

**Adding real photos:** put the image in `public/images/` (e.g. `public/images/shamim-sir.jpg`), then set
`photo: "/images/shamim-sir.jpg"` in `src/data/home.ts`. Courses (`image`) and books (`cover`) work the same way.
Until then, styled placeholders are shown.

**Button-styled links:** use `buttonClass()` from `@/lib/button-class`, e.g.
`<Link className={buttonClass({ size: "lg", className: "px-6" })}>`.

**Rule of thumb:** pages go in `app/`, reusable pieces go in `components/`, settings go in `config/`, and helpers go in `lib/`.

---

## Design system

All colors are defined once in [`src/app/globals.css`](src/app/globals.css). Change them there and the whole site updates.

| Token       | Use for                         | Tailwind class example            |
| ----------- | ------------------------------- | --------------------------------- |
| `primary`   | Main brand color (deep indigo)  | `bg-primary`, `text-primary`      |
| `highlight` | Warm amber for emphasis & CTAs  | `bg-highlight`                    |
| `secondary` | Soft indigo tint surfaces       | `bg-secondary`                    |
| `muted`     | Quiet backgrounds & helper text | `bg-muted`, `text-muted-foreground` |
| `success` / `destructive` | Status messages   | `text-success`                    |

**Fonts:** *Plus Jakarta Sans* for headings and *Inter* for body text.

**Text styles** (responsive, grow on bigger screens):
`text-display` · `text-h1` · `text-h2` · `text-h3` · `text-lead`

**Breakpoints:** phone (default) → `sm` 640px → `md` 768px (tablet) → `lg` 1024px (desktop) → `xl` 1280px.

### Adding more shadcn/ui components

```bash
npx shadcn@latest add dialog tabs avatar
```

They appear in `src/components/ui/`.

---

## Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the project dashboard, open **Connect** (or **Project Settings → API**).
3. Copy the **Project URL** and the **publishable (anon) key** into `.env.local`.

Which client to use:

- **In Client Components** (`"use client"`): `import { createClient } from "@/lib/supabase/client"`
- **In Server Components / Server Actions**: `import { createClient } from "@/lib/supabase/server"`

Never commit `.env.local`. It is already ignored by git.
