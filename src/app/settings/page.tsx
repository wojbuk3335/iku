import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { SettingsPage } from "@/components/settings/settings-page";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "creator") redirect("/admin/settings/profile");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();

  let fullName = profile?.full_name ?? null;
  let birthDate = profile?.birth_date ?? null;
  let interests = profile?.interests ?? [];
  let isPrivate = false;

  const withBirth = await supabase
    .from("profiles")
    .select("full_name, birth_date, interests, is_private")
    .eq("id", user.id)
    .maybeSingle();

  if (!withBirth.error && withBirth.data) {
    fullName = withBirth.data.full_name ?? fullName;
    birthDate = withBirth.data.birth_date ?? birthDate;
    isPrivate = Boolean(withBirth.data.is_private);
    if (Array.isArray(withBirth.data.interests)) {
      interests = withBirth.data.interests;
    }
  } else {
    const withoutPrivacy = await supabase
      .from("profiles")
      .select("full_name, birth_date, interests")
      .eq("id", user.id)
      .maybeSingle();

    if (!withoutPrivacy.error && withoutPrivacy.data) {
      fullName = withoutPrivacy.data.full_name ?? fullName;
      birthDate = withoutPrivacy.data.birth_date ?? birthDate;
      if (Array.isArray(withoutPrivacy.data.interests)) {
        interests = withoutPrivacy.data.interests;
      }
    } else {
      const withoutBirth = await supabase
        .from("profiles")
        .select("full_name, interests")
        .eq("id", user.id)
        .maybeSingle();

      if (!withoutBirth.error && withoutBirth.data) {
        fullName = withoutBirth.data.full_name ?? fullName;
        if (Array.isArray(withoutBirth.data.interests)) {
          interests = withoutBirth.data.interests;
        }
      }
    }
  }

  return (
    <SettingsPage
      email={user.email ?? ""}
      fullName={fullName}
      birthDate={birthDate}
      interests={interests}
      isPrivate={isPrivate}
    />
  );
}
