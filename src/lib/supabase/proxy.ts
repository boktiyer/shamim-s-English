import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import {
  DEFAULT_AFTER_LOGIN,
  GUEST_ONLY_PATHS,
  isProtectedPath,
} from "@/lib/auth/redirects";

/**
 * Runs on every request (from src/proxy.ts):
 *  1. Refreshes the login session cookie when it is about to expire.
 *  2. Sends logged-out visitors away from protected pages (fast first check;
 *     every protected page ALSO checks on the server with requireUser()).
 *  3. Sends logged-in users from /login and /register to the dashboard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) {
    // Supabase not configured yet: still keep protected pages closed.
    if (isProtectedPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validates the token and refreshes it if needed. Do not remove.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!isLoggedIn && isProtectedPath(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return redirectKeepingCookies(url, response);
  }

  if (isLoggedIn && GUEST_ONLY_PATHS.includes(pathname)) {
    return redirectKeepingCookies(new URL(DEFAULT_AFTER_LOGIN, request.url), response);
  }

  return response;
}

/** Redirect while keeping any refreshed session cookies. */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
