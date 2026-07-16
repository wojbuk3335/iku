import { notFound, redirect } from "next/navigation";
import { getCreatorEvent } from "@/app/admin/actions";
import { CreateEventForm } from "@/components/admin/create-event-form";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function EditCreatorEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") redirect("/events");

  const event = await getCreatorEvent(id);
  if (!event) notFound();

  return <CreateEventForm userEmail={user.email ?? null} event={event} />;
}
