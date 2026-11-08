import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <ComingSoon
      title="Registration opens soon"
      description="We're preparing student registration. Please check back shortly, or contact us to enroll today."
    />
  );
}
