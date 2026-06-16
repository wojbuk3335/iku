import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getProfileAuthContext } from "@/lib/auth/get-profile-auth";
import { getPostLoginPath } from "@/lib/auth/paths";
import type { UserRole } from "@/types/profile";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // OAuth czasem wraca z ?code= na / zamiast /auth/callback (np. zła Site URL w Supabase)
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

  if (user) {
    const authContext = await getProfileAuthContext(supabase, user.id);
    role = authContext.role;
    onboardingCompleted = authContext.onboardingCompleted;
  }

  const isAuthFlow = pathname.startsWith("/auth/");
  const isLoginPage = pathname === "/";
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin");
  const isEventsRoute = pathname.startsWith("/events");

  if (isAuthFlow) {
    return supabaseResponse;
  }

  if (!user && (isAdminRoute || isEventsRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(
      new URL(getPostLoginPath(role ?? "user", onboardingCompleted), request.url),
    );
  }

  if (user && isOnboardingRoute) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (onboardingCompleted) {
      return NextResponse.redirect(new URL("/events", request.url));
    }
  }

  if (user && role === "admin" && (isEventsRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (
    user &&
    isEventsRoute &&
    role !== "admin" &&
    !onboardingCompleted
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (user && isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/events", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
