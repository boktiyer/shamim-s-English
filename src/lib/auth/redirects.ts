/** Where students land after logging in. */
export const DEFAULT_AFTER_LOGIN = "/dashboard";

/** Routes that require a logged-in user (checked in the proxy and on the server). */
export const PROTECTED_PREFIXES = ["/dashboard"];

/** Pages a logged-in user doesn't need (they're sent to the dashboard instead). */
export const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

/**
 * Only allow redirects to paths on this site, e.g. "/dashboard".
 * Blocks open-redirect tricks like "//evil.com" or "https://evil.com".
 */
export function safeNextPath(next: unknown, fallback = DEFAULT_AFTER_LOGIN): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
