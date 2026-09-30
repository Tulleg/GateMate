import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const userId = request.cookies.get("gatemate_user_id")?.value;
  const role = request.cookies.get("gatemate_role")?.value;
  const onboardingCompletedCookie = request.cookies.get("gatemate_onboarding_completed")?.value;
  const isAuthenticated = Boolean(userId);
  const isCompleted = onboardingCompletedCookie === "true";

  // Excluded public / auth API routes that should never trigger onboarding redirects
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/check-in/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/onboarding/") ||
    pathname.startsWith("/api/stripe/");

  // 1. If user is authenticated as organizer and onboarding is incomplete:
  // Redirect all protected route calls to /onboarding
  if (isAuthenticated && role !== "superadmin" && !isCompleted) {
    if (!pathname.startsWith("/onboarding") && !isPublicRoute) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // 2. If user has completed onboarding and attempts to visit /onboarding:
  // Redirect to dashboard (/organizer)
  if (isAuthenticated && isCompleted && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/organizer", request.url));
  }

  // Protect /admin routes: organizers must not access superadmin portal
  if (pathname.startsWith("/admin")) {
    if (role === "organizer") {
      return NextResponse.redirect(new URL("/organizer", request.url));
    }
  }

  // Protect /organizer routes: superadmins must access superadmin portal (/admin)
  if (pathname.startsWith("/organizer")) {
    if (role === "superadmin") {
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
