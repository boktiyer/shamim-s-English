import { Suspense } from "react";
import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { getStudents } from "@/lib/admin/data";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/admin/fields";
import { DashboardSkeleton, EmptyState, PageHeader, Panel, formatDate } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage({ searchParams }: PageProps<"/admin/students">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Students searchParams={searchParams} />
    </Suspense>
  );
}

async function Students({ searchParams }: Pick<PageProps<"/admin/students">, "searchParams">) {
  await requireAdmin("/admin/students");
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const students = await getStudents(query);

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Search by name, Student ID, email, phone or college." />

      <form className="flex gap-2" role="search">
        <TextInput name="q" defaultValue={query} placeholder="Search students…" aria-label="Search students" />
        <Button type="submit" className="h-10 px-4">
          <Search data-icon="inline-start" aria-hidden /> Search
        </Button>
      </form>

      <Panel className="p-0 sm:p-0">
        {students.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Users} title="No students found" text={query ? "Try a different search." : "Students appear here after they register."} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">College</th>
                  <th className="px-4 py-3 font-medium">Courses</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {s.full_name || "—"} {s.role === "admin" && <Badge className="ml-1 h-5">Admin</Badge>}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{s.student_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{s.phone ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </td>
                    <td className="px-4 py-3">{s.college ?? "—"}</td>
                    <td className="px-4 py-3">{s.activeCourses ? `${s.activeCourses} active` : <span className="text-muted-foreground">None</span>}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="text-xs text-muted-foreground">
        To give a student access, use their Student ID on the Enrollments page, or approve their payment.
      </p>
    </div>
  );
}
