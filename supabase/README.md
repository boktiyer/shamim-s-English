# Database (Supabase)

The database is defined by the SQL files in [`migrations/`](migrations/). Run them **in order**. Each file name starts with a timestamp.

| File | What it creates |
| ---- | --------------- |
| `…01_types_and_helpers.sql` | Status types (roles, payment methods…) and the `updated_at` helper |
| `…02_profiles.sql` | `profiles` table, auto-created on sign-up; `is_admin()` |
| `…03_courses_content_books.sql` | `courses → subjects → chapters → lessons`, and `books` |
| `…04_payments_enrollments.sql` | `payments`, `enrollments`; `is_enrolled()` |
| `…05_notices_progress.sql` | `notices`, `lesson_progress` |
| `…06_rls_policies.sql` | All security rules, plus `get_course_curriculum()` |

## How the tables connect

```
auth.users ──1:1── profiles ─┬─< enrollments >── courses ──< subjects ──< chapters ──< lessons
                             ├─< payments    >──┘   │                                    │
                             └─< lesson_progress >──┼────────────────────────────────────┘
                                                    └──< notices (course_id empty = for everyone)
books ──< payments
```

`──<` means "one to many". For example, one course has many subjects.

## Who can do what (Row Level Security)

| Data | Visitor | Student | Admin |
| ---- | ------- | ------- | ----- |
| Published courses, books, course outline | ✅ read | ✅ read | ✅ full control |
| Draft courses / unpublished books | ❌ | ❌ | ✅ |
| Lesson videos & notes | Free-preview only | Free-preview + courses with an **active** enrollment | ✅ |
| Profiles | ❌ | Own only (can't change own role) | ✅ |
| Payments | ❌ | Own only; can submit as **pending** | ✅ verify / edit |
| Enrollments | ❌ | Own only (read) | ✅ |
| Lesson progress | ❌ | Own only, on lessons they can access | ✅ read |
| Notices | General | General + their courses | ✅ |

**Typical payment flow:** the student submits a bKash/Nagad transaction ID, which is saved as `pending`. The admin checks it, marks the payment `completed` and creates an `active` enrollment. Students can never approve their own payment or enroll themselves.

**Public course outline:** the `get_course_curriculum(course_id)` function returns subject, chapter and lesson titles for a published course, without any video links or notes. Use it on course pages for visitors.

---

## How to run the migrations

You only need **one** of the two options below.

### Option A: Supabase dashboard (easiest, no installs)

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the left menu, click **SQL Editor**, then **New query**.
3. Open `migrations/20261108000001_types_and_helpers.sql` in VS Code, copy everything, paste it into the editor and click **Run**.
4. Repeat step 3 for each file **in number order** (`…02`, `…03`, … `…06`).
5. Open **Table Editor**. You should see the 10 tables, each marked as RLS-enabled.

> If a file fails halfway, fix the problem and run that file again before moving on. Never skip a file.

### Option B: Supabase CLI (better once the project grows)

The CLI remembers which migrations have already run and only applies new ones.

```bash
npx supabase login                                   # opens the browser to sign in
npx supabase init                                    # only once; creates supabase/config.toml
npx supabase link --project-ref <your-project-ref>   # the ref is in your project URL
npx supabase db push                                 # applies every new migration
```

When a later phase adds a migration, just run `npx supabase db push` again.

---

## Make yourself an admin

Everyone who signs up becomes a **student**. To promote an account, sign up on the site first, then run this in the **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

This only works from the dashboard or with the service role. The app itself can never turn a student into an admin.

## Testing the rules locally

```bash
npm run test:db
```

This runs every migration in a temporary in-memory Postgres and checks 45 security rules (for example: "student B cannot see A's payment"). Run it after changing any migration.

## Security notes

- Only the **publishable (anon) key** goes in `.env.local`. **Never** put the `service_role` key in any `NEXT_PUBLIC_` variable or in browser code.
- Never edit a migration that has already been run on the live database. Add a new migration file instead.
