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
