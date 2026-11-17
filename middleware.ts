// middleware.ts — Edge-compatible middleware for admin route protection.
// The Edge Runtime doesn't support fs/path/crypto, so we can't read the DB here.
// Instead, we check if the session cookie exists (fast redirect for unauthenticated users).
// The actual role verification happens server-side in each admin page via getCurrentUser().

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "techpath_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Check session cookie — if missing, redirect to login
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Cookie exists — let the request through.
  // The admin page itself will verify the session and role server-side.
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
