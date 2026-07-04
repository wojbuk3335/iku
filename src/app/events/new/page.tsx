import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { CreateEventForm } from "@/components/events/create-event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return <CreateEventForm />;
}
