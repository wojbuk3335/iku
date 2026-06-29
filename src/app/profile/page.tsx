import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getUserEventsByStatus } from "@/lib/profile/get-user-events";
import { ProfilePage } from "@/components/profile/profile-page";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const [goingEvents, savedEvents] = await Promise.all([
    getUserEventsByStatus(user.id, "going"),
    getUserEventsByStatus(user.id, "saved"),
  ]);

  return (
    <ProfilePage
      email={user.email ?? ""}
      bio={profile?.bio ?? null}
      goingEvents={goingEvents}
      savedEvents={savedEvents}
    />
  );
}
