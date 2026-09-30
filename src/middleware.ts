import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes: organizers must not access superadmin portal
  if (pathname.startsWith("/admin")) {
    const roleCookie = request.cookies.get("gatemate_role")?.value;
    if (roleCookie === "organizer") {
      return NextResponse.redirect(new URL("/organizer", request.url));
    }
  }

  // Protect /organizer routes: superadmins must access superadmin portal (/admin)
  if (pathname.startsWith("/organizer")) {
    const roleCookie = request.cookies.get("gatemate_role")?.value;
    if (roleCookie === "superadmin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Header propagation for embed & iframe routes with CSP frame-ancestors restriction
  if (pathname.startsWith("/embed/")) {
    const response = NextResponse.next();
    const allowedAncestors = process.env.ALLOWED_EMBED_DOMAINS
      ? `'self' ${process.env.ALLOWED_EMBED_DOMAINS}`
      : "'self'";
    response.headers.set("Content-Security-Policy", `frame-ancestors ${allowedAncestors}`);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
