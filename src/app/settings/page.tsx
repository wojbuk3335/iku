import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { SettingsPage } from "@/components/settings/settings-page";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    <SettingsPage
      email={user.email ?? ""}
      interests={profile?.interests ?? []}
    />
  );
}
