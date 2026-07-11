import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getProfileAuthContext } from "@/lib/auth/get-profile-auth";
import { getPostLoginPath } from "@/lib/auth/paths";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code        = searchParams.get("code");
  const tokenHash   = searchParams.get("token_hash");
  const type        = searchParams.get("type");
  const next        = searchParams.get("next");
  const oauthError  = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  if (oauthError) {
    const reason = encodeURIComponent(oauthErrorDescription ?? oauthError);
    return NextResponse.redirect(`${origin}/?error=auth&reason=${reason}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  // PKCE flow (OAuth, magic link, email confirmation)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next?.startsWith("/") && !next.startsWith("//")) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`${origin}${await getRedirectPath(supabase)}`);
    }
  }

  // Token hash flow (password reset, email OTP)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "recovery" | "email" | "signup" });
    if (!error) {
      // For password recovery, always go to the reset-password page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      if (next?.startsWith("/") && !next.startsWith("//")) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`${origin}${await getRedirectPath(supabase)}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}

async function getRedirectPath(supabase: Awaited<ReturnType<typeof import("@supabase/ssr").createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "/events";
  const { role, onboardingCompleted } = await getProfileAuthContext(supabase, user.id);
  return getPostLoginPath(role, onboardingCompleted);
}
