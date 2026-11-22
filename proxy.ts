import { NextResponse, type NextRequest } from "next/server";

// Authorization is enforced on the server by requireUser/requireAdmin and the
// Better Auth session checks. Keep this proxy free of Supabase environment needs.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
