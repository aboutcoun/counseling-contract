import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/send", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const session = req.cookies.get("staff_session")?.value;
  const expected = process.env.SESSION_TOKEN;

  if (!expected || session !== expected) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/send/:path*", "/admin/:path*"],
};
