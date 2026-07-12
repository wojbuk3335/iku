import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { EditProfilePage } from "@/components/admin/settings/edit-profile-page";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") redirect("/events");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <EditProfilePage
      userEmail={user.email ?? null}
      fullName={data?.full_name ?? null}
      bio={data?.bio ?? null}
      avatarUrl={data?.avatar_url ?? null}
    />
  );
}
