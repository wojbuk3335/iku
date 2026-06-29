import { redirect } from "next/navigation";
import { HomeFeed } from "@/components/events/home-feed";
import { getPublishedEvents } from "@/lib/events/get-published-events";
import { getGoingCountsByEventIds } from "@/lib/events/get-going-counts";
import { personalizeFeed } from "@/lib/events/personalize-feed";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

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
  const interests = profile?.interests ?? [];
  const feed = personalizeFeed(events, interests);
  const allIds = events.map((e) => e.id);
  const goingCounts = await getGoingCountsByEventIds(allIds);

  return <HomeFeed feed={feed} goingCounts={goingCounts} />;
}
