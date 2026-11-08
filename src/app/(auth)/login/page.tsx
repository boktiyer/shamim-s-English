import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Login" };

type Notice = { type: "error" | "success" | "info"; text: string };

/** Messages shown after being sent to /login from somewhere else. */
const notices: Record<string, Notice> = {
  logged_out: { type: "success", text: "You have been logged out." },
  link_invalid: {
    type: "error",
    text: "That verification link is invalid or has expired. Log in to get a new one.",
  },
  reset_link_invalid: {
    type: "error",
    text: "That password reset link is invalid or has expired. Please request a new one.",
  },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to continue learning with Shamim's English."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create a student account
          </Link>
        </>
      }
    >
      {/* Reading the URL happens at request time, so it sits behind Suspense. */}
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormWithParams({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const key = String(params.error ?? params.message ?? "");
  const next = typeof params.next === "string" ? params.next : undefined;
  return <LoginForm next={next} notice={notices[key]} />;
}
