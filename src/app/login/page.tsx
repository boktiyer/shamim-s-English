import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <ComingSoon
      title="Login is coming soon"
      description="Student accounts are being set up. You'll be able to log in here very soon."
    />
  );
}
