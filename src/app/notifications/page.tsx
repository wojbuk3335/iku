import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getNotifications } from "./actions";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export const dynamic = "force-dynamic";

export default async function NotificationsRoute() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const notifications = await getNotifications();

  return <NotificationsPage notifications={notifications} />;
}
