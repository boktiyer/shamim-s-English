import { Pin } from "lucide-react";
import type { Notice } from "@/lib/dashboard/data";
import { formatDate } from "./ui";

export function NoticeList({ notices, compact }: { notices: Notice[]; compact?: boolean }) {
  return (
    <ul className="divide-y">
      {notices.map((n) => (
        <li key={n.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {n.is_pinned && (
              <span className="flex items-center gap-1 font-medium text-primary">
                <Pin className="size-3" aria-hidden /> Pinned
              </span>
            )}
            <span>{formatDate(n.published_at)}</span>
            <span>· {n.course?.title ?? "All students"}</span>
          </div>
          <p className="mt-1 font-semibold">{n.title}</p>
          <p className={compact ? "mt-1 line-clamp-2 text-sm text-muted-foreground" : "mt-1 text-sm whitespace-pre-line text-muted-foreground"}>
            {n.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
