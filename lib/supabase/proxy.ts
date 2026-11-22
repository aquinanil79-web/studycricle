import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

const PUBLIC_PATHS = ["/", "/login", "/register"];

// Runs on every request (see proxy.ts):
// 1. refreshes the Supabase session cookie if it is about to expire
// 2. sends logged-out visitors to /login
// (Sending logged-in users away from /login happens in app/(auth)/layout.tsx, because that
// check needs the profile row: a deleted account can still hold a valid token for a while.)
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) => supabaseResponse.headers.set(name, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims():
  // getClaims() is what verifies the token and refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth/");

  // Only page loads are redirected here. Server Actions are POST requests: a redirect
  // would break them, and each action already checks the user itself (requireUser()).
  if (!isLoggedIn && !isPublic && request.method === "GET") return redirectTo("/login");

  return supabaseResponse;

  // A redirect is a new response, so the refreshed cookies and the
  // no-cache headers must be copied onto it or the session is lost.
  function redirectTo(path: string) {
    const target = request.nextUrl.clone();
    target.pathname = path;
    target.search = "";

    const response = NextResponse.redirect(target);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(header);
      if (value) response.headers.set(header, value);
    }
    return response;
  }
}
