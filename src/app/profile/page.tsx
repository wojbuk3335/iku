import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { usernameFromEmail } from "@/lib/profile/username";

export const dynamic = "force-dynamic";

/** Własny profil → przekieruj na unikalny URL /profile/[username] */
export default async function ProfileRedirect() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const username =
    profile?.username?.trim() ||
    usernameFromEmail(user.email ?? profile?.email, user.id);

  redirect(`/profile/${encodeURIComponent(username.toLowerCase())}`);
}
