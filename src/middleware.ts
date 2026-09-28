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

  // Header propagation for embed & iframe routes
  if (pathname.startsWith("/embed/")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
