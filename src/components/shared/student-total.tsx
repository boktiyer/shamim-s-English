import { getStudentStats } from "@/lib/catalog";
import { studentBase } from "@/data/home";
import { CountUp } from "./count-up";

/** Total students (base + active enrollments), counting up from 0 when seen. */
export async function StudentTotal({ className }: { className?: string }) {
  const { total } = await getStudentStats();
  return <CountUp value={studentBase + total} suffix="+" className={className} />;
}
