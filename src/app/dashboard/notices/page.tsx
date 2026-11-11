import { Suspense } from "react";
import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { getNotices } from "@/lib/dashboard/data";
import { NoticeList } from "@/components/dashboard/notice-list";
import { DashboardSkeleton, EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Notices" };

export default function NoticesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Notices />
    </Suspense>
  );
}

async function Notices() {
  await requireUser("/dashboard/notices");
  const notices = await getNotices();

  return (
    <div className="space-y-6">
      <PageHeader title="Notices & Announcements" description="General announcements and updates for your courses." />
      {notices.length ? (
        <Panel>
          <NoticeList notices={notices} />
        </Panel>
      ) : (
        <EmptyState icon={Bell} title="No notices yet" text="Announcements from Shamim Sir will show up here." />
      )}
    </div>
  );
}
