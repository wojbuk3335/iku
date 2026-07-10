import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin") redirect("/events");

  return <div />;
}
