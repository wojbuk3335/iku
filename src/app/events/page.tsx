import { redirect } from "next/navigation";
import { HomeFeed } from "@/components/events/home-feed";
import { getPublishedEvents } from "@/lib/events/get-published-events";
import { getGoingCountsByEventIds } from "@/lib/events/get-going-counts";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getStoriesFeed } from "@/app/stories/actions";

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
  const allIds = events.map((e) => e.id);
  const [goingCounts, storyGroups] = await Promise.all([
    getGoingCountsByEventIds(allIds),
    getStoriesFeed().catch(() => []),
  ]);

  return (
    <HomeFeed
      events={events}
      interests={interests}
      goingCounts={goingCounts}
      storyGroups={storyGroups}
      currentUserId={user.id}
    />
  );
}
