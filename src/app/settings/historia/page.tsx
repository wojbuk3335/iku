import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getUserHistory } from "@/lib/profile/get-history";
import { HistoriaPage } from "@/components/settings/historia-page";

export const dynamic = "force-dynamic";

export default async function SettingsHistoriaPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "creator") redirect("/admin/settings/profile");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const history = await getUserHistory(user.id);

  return <HistoriaPage history={history} />;
}
