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
| `…07_student_id_and_college.sql` | Auto-generated Student ID; college name saved at sign-up |

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
4. Repeat step 3 for each file **in number order** (`…02`, `…03`, … up to the last one).
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

## Authentication settings (one-time, in the Supabase dashboard)

Student login uses **Supabase Auth** with email + password. In your project dashboard:

1. **Authentication → Sign In / Providers → Email**
   - Turn **Enable Email provider** on.
   - Turn **Confirm email** on, so students must verify their email.
   - Optional but recommended: set **Minimum password length** to `8`.
2. **Authentication → URL Configuration**
   - **Site URL:** your live address, e.g. `https://shamimsenglish.com` (use `http://localhost:3000` while developing).
   - **Redirect URLs:** add both of these:
     - `http://localhost:3000/auth/confirm`
     - `https://YOUR-LIVE-DOMAIN/auth/confirm`
3. **Authentication → Emails (Templates)**, recommended. With these templates, links work even when the student opens the email on a different phone or computer:
   - **Confirm signup**, replace the link with:
     ```html
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">Verify my email</a>
     ```
   - **Reset password**, replace the link with:
     ```html
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset my password</a>
     ```
   The default templates also work, but only when the link is opened in the same browser that requested it.
4. **Custom SMTP (before going live):** Supabase's built-in email sender only allows a few emails per hour. Under **Authentication → Emails → SMTP Settings**, connect a real email service (for example Resend, Brevo or Amazon SES).

The app also needs `NEXT_PUBLIC_SITE_URL` in `.env.local` (and on your host) to match the address students use. Email links are built from it.

### How the Student ID works

Every new account automatically gets a permanent, unique Student ID, for example **`SE2600001`**:
`SE` = Shamim's English, `26` = sign-up year, followed by a 5-digit running number. It is created by the database (migration `…07`), so it can't be faked from the browser, and nobody, not even an admin, can change it.

## Sample data (optional)

To try the student dashboard, run [`seed.sql`](seed.sql) in the SQL Editor. It adds one course with lessons, notes, notices and a book. The commented block at the end enrolls your test account as an approved student.

## Make yourself an admin

Everyone who signs up becomes a **student**. To promote an account, sign up on the site first, then run this in the **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

This only works from the dashboard or with the service role. The app itself can never turn a student into an admin.

Then log out and back in, and open **`/admin`** (or click **Admin Panel** in the header). From there you can approve payments, grant access, and manage students, courses, lessons, books and notices.

## Testing the rules locally

```bash
npm run test:db
```

This runs every migration in a temporary in-memory Postgres and checks 51 security rules (for example: "student B cannot see A's payment"). Run it after changing any migration.

## Security notes

- Only the **publishable (anon) key** goes in `.env.local`. **Never** put the `service_role` key in any `NEXT_PUBLIC_` variable or in browser code.
- Never edit a migration that has already been run on the live database. Add a new migration file instead.
