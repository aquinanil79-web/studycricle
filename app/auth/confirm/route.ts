import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const url = new URL("/login?confirm=failed", request.url);
  return NextResponse.redirect(url);
}
