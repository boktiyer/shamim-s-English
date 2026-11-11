import { Suspense } from "react";
import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { getNotes, type NoteFile } from "@/lib/dashboard/data";
import { DashboardSkeleton, EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Notes & PDFs" };

export default function NotesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Notes />
    </Suspense>
  );
}

async function Notes() {
  await requireUser("/dashboard/notes");
  const notes = await getNotes();

  const byCourse = new Map<string, NoteFile[]>();
  for (const n of notes) byCourse.set(n.courseTitle, [...(byCourse.get(n.courseTitle) ?? []), n]);

  return (
    <div className="space-y-6">
      <PageHeader title="Notes & PDFs" description="Lecture notes and worksheets from your active courses." />
      {notes.length === 0 ? (
        <EmptyState icon={FileText} title="No notes yet" text="Notes and PDFs from your approved courses will appear here." />
      ) : (
        [...byCourse].map(([courseTitle, files]) => (
          <Panel key={courseTitle} title={courseTitle}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {files.map((f) => (
                <li key={f.id}>
                  <a
                    href={f.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <FileText className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{f.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{f.chapterTitle}</span>
                    </span>
                    <Download className="size-4 shrink-0 text-muted-foreground" aria-label="Download" />
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        ))
      )}
    </div>
  );
}
