import { redirect } from "next/navigation";
import { CreateEventForm } from "@/components/admin/create-event-form";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export default async function AdminPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/");
  }

  if (profile?.role !== "admin") {
    redirect("/events");
  }

  return <CreateEventForm />;
}
