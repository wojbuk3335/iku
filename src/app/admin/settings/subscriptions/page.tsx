import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { SubscriptionsPage } from "@/components/admin/settings/subscriptions-page";

export const dynamic = "force-dynamic";

export default async function SubscriptionsSettingsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") redirect("/events");

  return <SubscriptionsPage userEmail={user.email ?? null} />;
}
