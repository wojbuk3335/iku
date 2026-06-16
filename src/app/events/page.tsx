import { redirect } from "next/navigation";
import { HomeFeed } from "@/components/events/home-feed";
import { getPublishedEvents } from "@/lib/events/get-published-events";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export default async function EventsPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const events = await getPublishedEvents();

  return <HomeFeed events={events} />;
}
