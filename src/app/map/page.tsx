import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getEventsForMap } from "./actions";
import { MapView } from "@/components/map/map-view";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const events = await getEventsForMap();

  return <MapView events={events} />;
}
