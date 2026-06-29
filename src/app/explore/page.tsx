import { redirect } from "next/navigation";
import { getPublishedEvents } from "@/lib/events/get-published-events";
import { getGoingCountsByEventIds } from "@/lib/events/get-going-counts";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { ExploreFeed } from "@/components/events/explore-feed";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const events = await getPublishedEvents();
  const goingCounts = await getGoingCountsByEventIds(events.map((e) => e.id));

  return <ExploreFeed events={events} goingCounts={goingCounts} />;
}
