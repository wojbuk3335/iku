import { notFound, redirect } from "next/navigation";
import { getCreatorEvent } from "@/app/admin/actions";
import { AchievementWizard } from "@/components/achievements/achievement-wizard";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function NewAchievementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") {
    redirect("/events");
  }

  const event = await getCreatorEvent(id);
  if (!event) notFound();

  return (
    <AchievementWizard
      eventId={id}
      eventTitle={event.title}
      returnTo={returnTo === "event" ? "event" : "list"}
    />
  );
}
