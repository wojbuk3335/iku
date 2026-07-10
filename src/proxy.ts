import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getProfileAuthContext } from "@/lib/auth/get-profile-auth";
import { getPostLoginPath } from "@/lib/auth/paths";
import type { UserRole } from "@/types/profile";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // OAuth czasem wraca z ?code= na / zamiast /auth/callback
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: UserRole | null = null;
  let onboardingCompleted = false;
  let isBlocked = false;

  if (user) {
    const authContext = await getProfileAuthContext(supabase, user.id);
    role = authContext.role;
    onboardingCompleted = authContext.onboardingCompleted;
    isBlocked = authContext.isBlocked;
  }

  const isAuthFlow        = pathname.startsWith("/auth/");
  const isLoginPage       = pathname === "/";
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAdminRoute      = pathname.startsWith("/admin");
  const isSuperAdminRoute = pathname.startsWith("/superadmin");
  const isEventsRoute     = pathname.startsWith("/events");
  const isBlockedPage     = pathname === "/blocked";

  // Always allow auth callbacks
  if (isAuthFlow) return supabaseResponse;

  // Blocked users → /blocked (except already there or logging out)
  if (user && isBlocked && !isBlockedPage) {
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  // Unblocked user on /blocked → send home
  if (user && !isBlocked && isBlockedPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to login
  if (!user && (isAdminRoute || isSuperAdminRoute || isEventsRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logged-in user on login page → send to their panel
  if (user && isLoginPage) {
    return NextResponse.redirect(
      new URL(getPostLoginPath(role ?? "user", onboardingCompleted), request.url),
    );
  }

  // Onboarding: admin/creator skip it
  if (user && isOnboardingRoute) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }
    if (role === "creator") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL("/events", request.url));
    }
  }

  // /superadmin — only admin
  if (user && isSuperAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL(getPostLoginPath(role ?? "user", onboardingCompleted), request.url));
  }

  // /admin — only admin or creator
  if (user && isAdminRoute && role !== "admin" && role !== "creator") {
    return NextResponse.redirect(new URL("/events", request.url));
  }

  // admin role should not browse /events or /admin (creator panel) → go to /superadmin
  if (user && role === "admin" && (isEventsRoute || isAdminRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/superadmin", request.url));
  }

  // creator role should not browse /events → go to /admin
  if (user && role === "creator" && isEventsRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // user without onboarding can't access /events
  if (user && isEventsRoute && role === "user" && !onboardingCompleted) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
