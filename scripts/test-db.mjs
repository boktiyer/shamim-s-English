// Database test: runs every migration in an in-memory Postgres (PGlite)
// with a minimal Supabase auth stand-in, then checks the security (RLS)
// rules as a visitor, two students and an admin.
//
// Run with:  npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = process.argv[2] ?? "supabase/migrations";
const db = new PGlite();

// ---- Minimal Supabase environment ----
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  -- Minimal stand-in for Supabase Storage
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on storage.objects to anon, authenticated, service_role;
  grant execute on function storage.foldername(text) to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`);

for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
  try {
    await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
    console.log("migrated", file);
  } catch (e) {
    console.error("MIGRATION FAILED", file, e.message);
    process.exit(1);
  }
}

// ---- Helpers ----
let passed = 0, failed = 0;
async function as(who, sql, params = []) {
  await db.exec("reset role");
  const claims = who.id ? JSON.stringify({ sub: who.id }) : "";
  await db.query("select set_config('request.jwt.claims', $1, false)", [claims]);
  await db.exec(`set role ${who.role}`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
function check(name, cond) {
  if (cond) { passed++; console.log("  ok  ", name); }
  else { failed++; console.log("  FAIL", name); }
}
async function expectError(name, fn, pattern) {
  try { await fn(); check(name + " (expected error, got none)", false); }
  catch (e) { check(name, pattern ? pattern.test(e.message) : true); }
}

// ---- Users (signup trigger should create profiles) ----
const mk = async (email, meta) =>
  (await db.query("insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [email, JSON.stringify(meta)])).rows[0].id;
const aId = await mk("a@test.com", { full_name: "Student A", phone: "017", college: "Chittagong College", role: "admin" });
const bId = await mk("b@test.com", { full_name: "Student B" });
const adminId = await mk("admin@test.com", { full_name: "Admin" });

const p = await db.query("select id, full_name, role, student_id, college, phone from public.profiles order by email");
check("signup trigger created 3 profiles", p.rows.length === 3);
check("metadata 'role: admin' is ignored at signup", p.rows.every((r) => r.role === "student"));
check("every profile gets a Student ID like SE2600001", p.rows.every((r) => /^SE\d{7}$/.test(r.student_id)));
check("Student IDs are unique", new Set(p.rows.map((r) => r.student_id)).size === 3);
check("phone saved from sign-up data", p.rows.find((r) => r.id === aId)?.phone === "017");

// Promote admin from SQL editor (auth.uid() is null) â€” allowed
await db.query("update public.profiles set role = 'admin' where id = $1", [adminId]);

const anon = { role: "anon" };
const A = { role: "authenticated", id: aId };
const B = { role: "authenticated", id: bId };
const ADMIN = { role: "authenticated", id: adminId };

console.log("\nprofiles");
check("student sees only own profile", (await as(A, "select id from public.profiles")).rows.length === 1);
check("anon sees no profiles", (await as(anon, "select id from public.profiles")).rows.length === 0);
check("admin sees all profiles", (await as(ADMIN, "select id from public.profiles")).rows.length === 3);
await as(A, "update public.profiles set full_name = 'A Updated' where id = $1", [aId]);
check("student can update own name", (await db.query("select full_name from public.profiles where id=$1", [aId])).rows[0].full_name === "A Updated");
await expectError("student cannot make self admin", () => as(A, "update public.profiles set role='admin' where id=$1", [aId]), /Only admins/);
const bUpd = await as(A, "update public.profiles set full_name='hacked' where id=$1 returning id", [bId]);
check("student cannot update another profile", bUpd.rows.length === 0);
check("college saved from sign-up data", (await as(A, "select college from public.profiles")).rows[0].college === "Chittagong College");
await expectError("student cannot change Student ID", () => as(A, "update public.profiles set student_id='SE0000001' where id=$1", [aId]), /cannot be changed/);
await expectError("admin cannot change Student ID either", () => as(ADMIN, "update public.profiles set student_id='SE0000001' where id=$1", [aId]), /cannot be changed/);
await expectError("student cannot insert profiles", () => as(A, "insert into public.profiles (id) values (gen_random_uuid())"));

console.log("\ncourses & content");
await expectError("student cannot create course", () => as(A, "insert into public.courses (slug,title,category) values ('x','X','hsc_1st')"));
const course = (await as(ADMIN, "insert into public.courses (slug,title,category,status,price) values ('hsc-revision','HSC Revision','hsc_2nd','published',2500) returning id")).rows[0].id;
const draft = (await as(ADMIN, "insert into public.courses (slug,title,category,status) values ('draft-course','Draft','admission','draft') returning id")).rows[0].id;
const subj = (await as(ADMIN, "insert into public.subjects (course_id,title,position) values ($1,'English 1st Paper',1) returning id", [course])).rows[0].id;
const chap = (await as(ADMIN, "insert into public.chapters (subject_id,title,position) values ($1,'Unit 1',1) returning id", [subj])).rows[0].id;
const freeL = (await as(ADMIN, "insert into public.lessons (chapter_id,title,video_url,position,is_free_preview) values ($1,'Intro','https://v/free',1,true) returning id", [chap])).rows[0].id;
const paidL = (await as(ADMIN, "insert into public.lessons (chapter_id,title,video_url,position) values ($1,'Lesson 2','https://v/paid',2) returning id", [chap])).rows[0].id;
const dsubj = (await as(ADMIN, "insert into public.subjects (course_id,title) values ($1,'Draft subject') returning id", [draft])).rows[0].id;

check("anon sees only published course", (await as(anon, "select id from public.courses")).rows.length === 1);
check("admin sees draft too", (await as(ADMIN, "select id from public.courses")).rows.length === 2);
const anonSubjects = (await as(anon, "select id from public.subjects")).rows;
check("anon sees subjects of published course only", anonSubjects.length === 1 && anonSubjects[0].id !== dsubj);
check("anon sees chapters", (await as(anon, "select id from public.chapters")).rows.length === 1);
const anonLessons = (await as(anon, "select id, video_url from public.lessons")).rows;
check("anon sees only free-preview lesson", anonLessons.length === 1 && anonLessons[0].id === freeL);
const curr = (await as(anon, "select * from public.get_course_curriculum($1)", [course])).rows;
check("curriculum shows full outline to anon (2 lessons)", curr.length === 2);
check("curriculum has no video_url column", !("video_url" in curr[0]));
check("curriculum hides draft course from anon", (await as(anon, "select * from public.get_course_curriculum($1)", [draft])).rows.length === 0);
await expectError("anon cannot update lesson", async () => {
  const r = await as(anon, "update public.lessons set title='x' returning id");
  if (r.rows.length === 0) throw new Error("no rows");
});

console.log("\npayments");
await expectError("student cannot self-approve payment", () => as(A, "insert into public.payments (user_id,course_id,amount,method,status) values ($1,$2,2500,'bkash','completed')", [aId, course]));
await expectError("student cannot pay as someone else", () => as(A, "insert into public.payments (user_id,course_id,amount,method) values ($1,$2,2500,'bkash')", [bId, course]));
const pay = (await as(A, "insert into public.payments (user_id,course_id,amount,method,transaction_id) values ($1,$2,2500,'bkash','TRX1') returning id", [aId, course])).rows[0].id;
check("student can submit pending payment", !!pay);
check("student B cannot see A's payment", (await as(B, "select id from public.payments")).rows.length === 0);
const upd = await as(A, "update public.payments set status='completed' returning id");
check("student cannot update payment status", upd.rows.length === 0);
await as(ADMIN, "update public.payments set status='completed', verified_by=$1, paid_at=now() where id=$2", [adminId, pay]);

console.log("\nenrollments & lesson access");
await expectError("student cannot self-enroll", () => as(A, "insert into public.enrollments (user_id,course_id,status) values ($1,$2,'active')", [aId, course]));
await as(ADMIN, "insert into public.enrollments (user_id,course_id,payment_id,status) values ($1,$2,$3,'active')", [aId, course, pay]);
check("student A sees own enrollment", (await as(A, "select id from public.enrollments")).rows.length === 1);
check("student B sees no enrollments", (await as(B, "select id from public.enrollments")).rows.length === 0);
check("enrolled A sees both lessons", (await as(A, "select id from public.lessons")).rows.length === 2);
check("non-enrolled B sees only free lesson", (await as(B, "select id from public.lessons")).rows.length === 1);
// Expired enrollment loses access
await as(ADMIN, "update public.enrollments set expires_at = now() - interval '1 day' where user_id=$1", [aId]);
check("expired enrollment loses paid lesson access", (await as(A, "select id from public.lessons")).rows.length === 1);
await as(ADMIN, "update public.enrollments set expires_at = null where user_id=$1", [aId]);

console.log("\nlesson progress");
await as(A, "insert into public.lesson_progress (user_id,lesson_id,progress_percent) values ($1,$2,50)", [aId, paidL]);
check("A can record progress on enrolled lesson", (await as(A, "select id from public.lesson_progress")).rows.length === 1);
await expectError("B cannot record progress on paid lesson", () => as(B, "insert into public.lesson_progress (user_id,lesson_id) values ($1,$2)", [bId, paidL]));
await expectError("A cannot record progress for B", () => as(A, "insert into public.lesson_progress (user_id,lesson_id) values ($1,$2)", [bId, freeL]));
check("B cannot see A's progress", (await as(B, "select id from public.lesson_progress")).rows.length === 0);
check("admin can see all progress", (await as(ADMIN, "select id from public.lesson_progress")).rows.length === 1);
await expectError("progress percent > 100 rejected", () => as(A, "update public.lesson_progress set progress_percent = 150 where user_id=$1", [aId]));

console.log("\nbooks & notices");
await as(ADMIN, "insert into public.books (slug,title,price,is_published) values ('grammar','Grammar',450,true),('hidden','Hidden',300,false)");
check("anon sees only published books", (await as(anon, "select id from public.books")).rows.length === 1);
await expectError("student cannot create book", () => as(A, "insert into public.books (slug,title,price) values ('x','X',1)"));
await as(ADMIN, "insert into public.notices (title,body,is_published) values ('General','Hello all',true)");
await as(ADMIN, "insert into public.notices (title,body,is_published,course_id) values ('Course','Class at 8pm',true,$1)", [course]);
await as(ADMIN, "insert into public.notices (title,body,is_published) values ('Draft','not yet',false)");
check("anon sees only general published notice", (await as(anon, "select id from public.notices")).rows.length === 1);
check("enrolled A sees general + course notice", (await as(A, "select id from public.notices")).rows.length === 2);
check("B sees only general notice", (await as(B, "select id from public.notices")).rows.length === 1);
check("admin sees all notices", (await as(ADMIN, "select id from public.notices")).rows.length === 3);

console.log("\nadmin panel");
const pay2 = (await as(B, "insert into public.payments (user_id,course_id,amount,method,transaction_id) values ($1,$2,2500,'nagad','TRX-B') returning id", [bId, course])).rows[0].id;
check("admin sees all payments", (await as(ADMIN, "select id from public.payments")).rows.length === 2);
await as(ADMIN, "update public.payments set status='completed', verified_by=$1, paid_at=now() where id=$2", [adminId, pay2]);
await as(ADMIN, "insert into public.enrollments (user_id,course_id,payment_id,status) values ($1,$2,$3,'active') on conflict (user_id,course_id) do update set status='active', payment_id=excluded.payment_id", [bId, course, pay2]);
check("approve flow: B now has active enrollment", (await as(B, "select status from public.enrollments")).rows[0]?.status === "active");
check("approve flow: B can read paid lessons", (await as(B, "select id from public.lessons")).rows.length === 2);
const bEnroll = await as(B, "update public.enrollments set status='cancelled' returning id");
check("student cannot change own enrollment status", bEnroll.rows.length === 0);
await as(ADMIN, "update public.enrollments set status='cancelled' where user_id=$1", [bId]);
check("admin cancel removes B's paid access", (await as(B, "select id from public.lessons")).rows.length === 1);
const fks = (await db.query("select conname from pg_constraint where conname in ('payments_user_id_fkey','enrollments_user_id_fkey')")).rows;
check("FK names used by admin queries exist", fks.length === 2);

console.log("\nlesson publishing & PDF storage");
await as(ADMIN, "update public.enrollments set status='active' where user_id=$1", [aId]);
const draftL = (await as(ADMIN, "insert into public.lessons (chapter_id,title,position,is_published) values ($1,'Draft lesson',3,false) returning id", [chap])).rows[0].id;
check("enrolled A cannot see draft lesson", !(await as(A, "select id from public.lessons")).rows.some((r) => r.id === draftL));
check("curriculum hides draft lesson from students", !(await as(A, "select lesson_id from public.get_course_curriculum($1)", [course])).rows.some((r) => r.lesson_id === draftL));
check("admin curriculum includes draft lesson", (await as(ADMIN, "select lesson_id from public.get_course_curriculum($1)", [course])).rows.some((r) => r.lesson_id === draftL));
check("lesson-files bucket is private", (await db.query("select public from storage.buckets where id='lesson-files'")).rows[0]?.public === false);
await expectError("student cannot upload a file", () => as(A, "insert into storage.objects (bucket_id,name) values ('lesson-files', $1)", [`${paidL}/hack.pdf`]));
await as(ADMIN, "insert into storage.objects (bucket_id,name) values ('lesson-files',$1),('lesson-files',$2)", [`${paidL}/notes.pdf`, `${draftL}/draft.pdf`]);
check("enrolled A can read PDF of paid lesson", (await as(A, "select name from storage.objects where name like $1", [`${paidL}/%`])).rows.length === 1);
check("enrolled A cannot read PDF of draft lesson", (await as(A, "select name from storage.objects where name like $1", [`${draftL}/%`])).rows.length === 0);
const bUser = await mk("b2@test.com", { full_name: "Student B2" });
check("non-enrolled student cannot read paid PDF", (await as({ role: "authenticated", id: bUser }, "select name from storage.objects")).rows.length === 0);
check("anon cannot read any PDF", (await as(anon, "select name from storage.objects")).rows.length === 0);
const del = await as(A, "delete from storage.objects returning id");
check("student cannot delete files", del.rows.length === 0);

console.log("\ncloudflare stream video id");
await as(ADMIN, "update public.lessons set stream_video_id='f65014bc6ff5419ea86e7972a047ba22' where id=$1", [paidL]);
check("admin can link a stream video id", (await as(ADMIN, "select stream_video_id from public.lessons where id=$1", [paidL])).rows[0].stream_video_id?.length === 32);
await expectError("invalid stream video id rejected", () => as(ADMIN, "update public.lessons set stream_video_id='not-a-video' where id=$1", [paidL]));
const sv = await as(A, "update public.lessons set stream_video_id=null where id=$1 returning id", [paidL]);
check("student cannot change lesson video", sv.rows.length === 0);
check("non-enrolled student cannot read video id", (await as({ role: "authenticated", id: bUser }, "select stream_video_id from public.lessons where id=$1", [paidL])).rows.length === 0);

console.log("\npayments: manual + sslcommerz rules");
const C2 = (await as(ADMIN, "insert into public.courses (slug,title,category,status,price) values ('hsc-2028','HSC 2028','hsc_1st','published',8000) returning id")).rows[0].id;
const S = { role: "authenticated", id: bUser };
await expectError("wrong amount rejected (must equal course price)", () => as(S, "insert into public.payments (user_id,course_id,amount,method,transaction_id) values ($1,$2,10,'bkash','TRX100')", [bUser, C2]));
await expectError("lower-case/unnormalized TrxID rejected", () => as(S, "insert into public.payments (user_id,course_id,amount,method,transaction_id) values ($1,$2,8000,'bkash',' trx100 ')", [bUser, C2]));
await expectError("screenshot in someone else's folder rejected", () => as(S, "insert into public.payments (user_id,course_id,amount,method,transaction_id,screenshot_path) values ($1,$2,8000,'bkash','TRX100',$3)", [bUser, C2, `${aId}/x.jpg`]));
await expectError("student cannot set gateway fields", () => as(S, "insert into public.payments (user_id,course_id,amount,method,transaction_id,val_id) values ($1,$2,8000,'bkash','TRX100','VAL1')", [bUser, C2]));
await as(S, "insert into public.payments (user_id,course_id,amount,method,transaction_id,sender_number,screenshot_path) values ($1,$2,8000,'bkash','TRX100','01712345678',$3)", [bUser, C2, `${bUser}/proof.jpg`]);
check("valid manual payment accepted", (await as(S, "select id from public.payments where transaction_id='TRX100'")).rows.length === 1);
await expectError("same TrxID cannot be used twice", () => as(A, "insert into public.payments (user_id,course_id,amount,method,transaction_id) values ($1,$2,8000,'nagad','TRX100')", [aId, C2]));
await expectError("only one open manual payment per course", () => as(S, "insert into public.payments (user_id,course_id,amount,method,transaction_id) values ($1,$2,8000,'nagad','TRX200')", [bUser, C2]));
await as(S, "insert into public.payments (user_id,course_id,amount,method,transaction_id) values ($1,$2,8000,'sslcommerz','SEONLINE1')", [bUser, C2]);
check("online (sslcommerz) attempt allowed alongside", (await as(S, "select id from public.payments where method='sslcommerz'")).rows.length === 1);
check("payment-proofs bucket is private", (await db.query("select public from storage.buckets where id='payment-proofs'")).rows[0]?.public === false);
await as(S, "insert into storage.objects (bucket_id,name) values ('payment-proofs',$1)", [`${bUser}/proof.jpg`]);
await expectError("student cannot upload into another student's folder", () => as(S, "insert into storage.objects (bucket_id,name) values ('payment-proofs',$1)", [`${aId}/fake.jpg`]));
check("student can read own proof", (await as(S, "select name from storage.objects where bucket_id='payment-proofs'")).rows.length === 1);
check("other student cannot read the proof", (await as(A, "select name from storage.objects where bucket_id='payment-proofs'")).rows.length === 0);
check("admin can read all proofs", (await as(ADMIN, "select name from storage.objects where bucket_id='payment-proofs'")).rows.length === 1);

console.log("\nbook store");
const paidBook = (await as(ADMIN, "insert into public.books (slug,title,price,stock,is_published) values ('secret-weapon','Secret Weapon',500,2,true) returning id")).rows[0].id;
const freeBook = (await as(ADMIN, "insert into public.books (slug,title,price,stock,is_published) values ('smart-qb','Smart QB',0,5,true) returning id")).rows[0].id;
const hiddenBook = (await db.query("select id from public.books where slug='hidden'")).rows[0].id;
const place = (who, book, qty, method = null, sender = null, trx = null, shot = null) =>
  as(who, "select public.place_book_order($1,$2,'Student Name','01712345678','Lokman Tower, Chawkbazar, Chittagong',null,$3,$4,$5,$6) as no", [book, qty, method, sender, trx, shot]).then((r) => r.rows[0].no);
const stockOf = async (id) => (await db.query("select stock from public.books where id=$1", [id])).rows[0].stock;

await expectError("visitor cannot place an order", () => place(anon, paidBook, 1));
await expectError("student cannot insert an order directly", () => as(S, "insert into public.book_orders (user_id,book_id,book_title,unit_price,total,recipient_name,phone,address) values ($1,$2,'x',0,0,'Name','01712345678','Some long address')", [bUser, paidBook]));
await expectError("student cannot insert a book payment directly", () => as(S, "insert into public.payments (user_id,book_id,amount,method,transaction_id) values ($1,$2,1,'bkash','BOOKTRX09')", [bUser, paidBook]));
await expectError("paid book needs payment details", () => place(S, paidBook, 1), /payment method/);
await expectError("book screenshot must be in own folder", () => place(S, paidBook, 1, "bkash", "01712345678", "BOOKTRX01", `${aId}/x.jpg`), /screenshot/);
const orderNo = await place(S, paidBook, 1, "bkash", "01712345678", "BOOKTRX01", `${bUser}/book.jpg`);
check("order gets an order number", /^BK-[0-9A-F]{8}$/.test(orderNo));
const ord = (await db.query("select o.total, o.unit_price, o.status, p.amount, p.book_id, p.status as pay_status from public.book_orders o join public.payments p on p.id=o.payment_id where o.order_no=$1", [orderNo])).rows[0];
check("price and payment come from the database", Number(ord?.total) === 500 && Number(ord?.amount) === 500 && ord?.book_id === paidBook && ord?.pay_status === "pending");
check("ordering reserves stock", (await stockOf(paidBook)) === 1);
await expectError("one open order per book", () => place(S, paidBook, 1, "bkash", "01712345678", "BOOKTRX02", `${bUser}/b2.jpg`));
await expectError("TrxID can't be reused for a book", () => place(A, paidBook, 1, "nagad", "01812345678", "BOOKTRX01", `${aId}/a.jpg`));
check("failed order does not take stock", (await stockOf(paidBook)) === 1);
await expectError("cannot order more than in stock", () => place(A, paidBook, 2, "bkash", "01812345678", "BOOKTRX03", `${aId}/a.jpg`), /stock/);
await expectError("hidden book cannot be ordered", () => place(A, hiddenBook, 1), /not available/);
await expectError("free book needs an active enrollment", () => place(S, freeBook, 1), /enrolled/);
const freeNo = await place(A, freeBook, 1);
check("enrolled student gets free book without payment", (await db.query("select payment_id, total from public.book_orders where order_no=$1", [freeNo])).rows[0]?.payment_id === null);
check("student sees only own orders", (await as(S, "select order_no from public.book_orders")).rows.length === 1);
check("student cannot change order status", (await as(S, "update public.book_orders set status='delivered' returning id")).rows.length === 0);
check("admin sees all orders", (await as(ADMIN, "select id from public.book_orders")).rows.length === 2);
await as(ADMIN, "update public.book_orders set status='cancelled' where order_no=$1", [orderNo]);
check("cancelling returns stock", (await stockOf(paidBook)) === 2);
await expectError("cancelled order cannot be reopened", () => as(ADMIN, "update public.book_orders set status='confirmed' where order_no=$1", [orderNo]), /reopened/);
check("book-assets bucket is public", (await db.query("select public from storage.buckets where id='book-assets'")).rows[0]?.public === true);
await expectError("student cannot upload book covers", () => as(S, "insert into storage.objects (bucket_id,name) values ('book-assets',$1)", [`covers/${paidBook}/x.jpg`]));
await as(ADMIN, "insert into storage.objects (bucket_id,name) values ('book-assets',$1)", [`covers/${paidBook}/cover.jpg`]);
check("admin can upload book covers", (await as(ADMIN, "select name from storage.objects where bucket_id='book-assets'")).rows.length === 1);

console.log("\nmisc");
const before = (await db.query("select updated_at from public.courses where id=$1", [course])).rows[0].updated_at;
await new Promise((r) => setTimeout(r, 20));
await as(ADMIN, "update public.courses set title='HSC Revision 2' where id=$1", [course]);
const after = (await db.query("select updated_at from public.courses where id=$1", [course])).rows[0].updated_at;
check("updated_at trigger works", after > before);
await db.query("delete from auth.users where id=$1", [bId]);
check("deleting auth user cascades to profile", (await db.query("select 1 from public.profiles where id=$1", [bId])).rows.length === 0);
const noRls = await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity");
check("RLS enabled on every public table", noRls.rows.length === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
