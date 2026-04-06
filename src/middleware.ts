import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  // Public paths — no auth needed
  const publicPaths = ["/", "/auth/login", "/auth/verify", "/auth/wallet", "/auth/success"];
  if (publicPaths.includes(pathname)) return NextResponse.next();

  // API routes handle their own auth
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Static assets
  if (pathname.startsWith("/_next") || pathname.includes("favicon")) return NextResponse.next();

  // Protected routes — require session cookie
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
