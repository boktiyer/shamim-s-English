import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ResendVerificationForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <div className="w-full text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        <MailCheck className="size-8" aria-hidden />
      </span>
      <Suspense fallback={<VerifyEmailContent />}>
        <VerifyEmailWithParams searchParams={searchParams} />
      </Suspense>
      <p className="mt-8 text-sm text-muted-foreground">
        Already verified?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

async function VerifyEmailWithParams({ searchParams }: Pick<PageProps<"/verify-email">, "searchParams">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : undefined;
  return <VerifyEmailContent email={email} unverified={params.reason === "unverified"} />;
}

function VerifyEmailContent({ email, unverified }: { email?: string; unverified?: boolean }) {
  return (
    <>
      <h1 className="mt-6 text-h1">{unverified ? "Please verify your email" : "Check your inbox"}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        {unverified ? "You need to verify your email before logging in. " : ""}
        We sent a verification link to{" "}
        <strong className="font-semibold text-foreground">{email ?? "your email address"}</strong>.
        Click the link in the email to activate your account.
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Can&apos;t find it? Check your spam or promotions folder.
      </p>
      {email && (
        <div className="mx-auto mt-8 max-w-xs">
          <ResendVerificationForm email={email} />
        </div>
      )}
    </>
  );
}
