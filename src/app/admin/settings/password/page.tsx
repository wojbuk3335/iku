import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { ChangePasswordForm } from "@/components/admin/settings/change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") redirect("/events");

  return <ChangePasswordForm userEmail={user.email ?? null} />;
}
