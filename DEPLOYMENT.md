# Deploying Shamim's English to Vercel

Nothing here deploys automatically. Follow the steps in order. Secrets go **only** into Vercel's
Environment Variables screen, never into code, GitHub or chat.

The production database is the existing Supabase project (`udpugacdexulnrsppenb`, Sydney).
`vercel.json` runs the server in Sydney (`syd1`) as well, so every database call stays short.

---

## 1. Before you start: checklist

- [ ] All migrations are applied (01–11). Check: Supabase → SQL Editor → `select * from public.book_orders limit 1;` runs without error.
- [ ] `npm run build` passes locally.
- [ ] You own the domain (e.g. `shamimsenglish.com`) and can edit its DNS.
- [ ] Your admin account works (you can open `/admin`).

## 2. Create the Vercel project

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project** → import `boktiyer/shamim-s-English`.
3. Framework: **Next.js** (detected). Leave build settings as they are.
4. Add the environment variables from step 3 **before** clicking Deploy.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Value | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://udpugacdexulnrsppenb.supabase.co` | No (public) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (Supabase → Project Settings → API Keys) | No (public) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` (no trailing slash) | No |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` (Supabase → API Keys → Secret keys) | **Yes** |
| `SSLCOMMERZ_STORE_ID` | live store ID from SSLCommerz | **Yes** |
| `SSLCOMMERZ_STORE_PASSWORD` | live store password | **Yes** |
| `SSLCOMMERZ_SANDBOX` | `true` for testing, `false` for real money | No |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Stream | **Yes** |
| `CLOUDFLARE_STREAM_API_TOKEN` | API token with *Stream: Edit* | **Yes** |
| `CLOUDFLARE_STREAM_CUSTOMER_CODE` | from `customer-<CODE>.cloudflarestream.com` | No |
| `CLOUDFLARE_STREAM_KEY_ID` | from your `.env.local` after `npm run stream:setup` | **Yes** |
| `CLOUDFLARE_STREAM_KEY_PEM` | from your `.env.local` (paste the whole value) | **Yes** |

Rules:
- Mark secret ones as **Sensitive** in Vercel. Never give a secret a `NEXT_PUBLIC_` name (that sends it to every browser).
- Set them for **Production**. For **Preview** deployments, use `SSLCOMMERZ_SANDBOX=true` (or leave the SSLCommerz values out).
- After changing a variable, **redeploy** (Deployments → ⋯ → Redeploy). `NEXT_PUBLIC_*` values are built into the site.

What happens if something is missing:
- No `SUPABASE_SECRET_KEY` or SSLCommerz values → only the bKash option is shown.
- `SSLCOMMERZ_SANDBOX=false` but the site URL isn't `https://` → online payment is switched off on purpose.
- No Cloudflare values → videos can't be uploaded or played (the rest of the site works).

## 4. Custom domain and HTTPS

1. Vercel → Project → **Settings → Domains** → add `your-domain.com` and `www.your-domain.com`.
2. At your domain registrar, add the DNS records Vercel shows. Usually:
   - `A` record for `@` → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`
3. Wait until Vercel shows **Valid Configuration**. Vercel issues and renews the HTTPS certificate automatically, and redirects HTTP to HTTPS.
4. Choose one main address (e.g. redirect `www` → the bare domain) and use exactly that in `NEXT_PUBLIC_SITE_URL`.

## 5. Supabase production settings

**Authentication → URL Configuration**
- **Site URL:** `https://your-domain.com`
- **Redirect URLs:** `https://your-domain.com/**` (keep `http://localhost:3000/**` for local work).

**Authentication → Emails**
- Templates: use the `token_hash` links from [supabase/README.md](supabase/README.md) (step 3). They use `{{ .SiteURL }}`, so they follow the Site URL above.
- **SMTP Settings (required before launch):** the built-in sender only sends a few emails per hour, so new students would not receive verification emails. Connect Resend, Brevo or Amazon SES and send from an address on your domain.

**Authentication → Attack protection / Passwords** (recommended)
- Turn on **leaked password protection** and keep **email confirmation** on.

**Database security** (already in place, re-check after any change)
- Row Level Security is on for every table. The automated test (`npm run test:db`, 107 checks) covers students, admins and visitors.
- Database → **Advisors → Security**: should show no errors. Fix any new warning before launch.
- The secret key is used only on the server, for SSLCommerz callbacks. If it ever leaks, rotate it in Supabase → API Keys and update Vercel.
- Change the database password if it was ever shared, and keep only trusted people as project members.
- Backups: the Pro plan has daily backups. On the Free plan, export a backup regularly (Database → Backups, or `supabase db dump`).
- The Free plan pauses a project after a week with no activity. Use Pro for a live site.

## 6. SSLCommerz: going live

1. Test the whole flow first with `SSLCOMMERZ_SANDBOX=true` on the live domain:
   pay → success page → course unlocked.
2. Apply for a live store at SSLCommerz (trade licence and bank details needed). They give you a live Store ID and password.
3. In the SSLCommerz merchant panel, set the **IPN URL** to
   `https://your-domain.com/payments/sslcommerz/ipn`
   The success, fail and cancel URLs are sent by the site with every payment:
   `https://your-domain.com/payments/sslcommerz/success|fail|cancel`
4. In Vercel, set the live `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD`, set `SSLCOMMERZ_SANDBOX=false`, then redeploy.
5. Make one small real payment and check that the course unlocks and the payment shows in Admin → Approvals history.

Every payment is checked with SSLCommerz's Validation API on the server: amount, currency and transaction ID. A forged success callback does nothing.

## 7. Cloudflare Stream

1. Run `npm run stream:setup` locally once, if you haven't already. It writes `CLOUDFLARE_STREAM_KEY_ID` and `CLOUDFLARE_STREAM_KEY_PEM` into `.env.local`.
2. Copy all five `CLOUDFLARE_*` values into Vercel (step 3).
3. Optional extra protection: Cloudflare → Stream → each video → **Settings → Allowed origins** → add `your-domain.com`.
4. Upload a test video in Admin → a lesson. Check that it plays for an enrolled student, and not for a logged-out visitor or a student who isn't enrolled.

## 8. Deploy and check

1. Click **Deploy** (or push to `main`; Vercel builds every push).
2. On the live site, check:
   - [ ] Homepage, `/login`, `/register` open over `https://`.
   - [ ] Register a new account. The verification email arrives and its link opens your domain (not localhost).
   - [ ] Log in and open the dashboard. Open `/admin` with your admin account. A normal student gets sent away from `/admin`.
   - [ ] Enroll with bKash (TrxID + screenshot). Approve in Admin → Approvals. The course unlocks.
   - [ ] Order a book. Confirm it in Admin → Book Orders.
   - [ ] Online payment in sandbox mode. Then do step 6 for live.
   - [ ] Lesson video and PDF open only for enrolled students.
3. If something fails, Vercel → Project → **Logs** shows server errors (secrets are never logged).
