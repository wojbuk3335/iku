import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { BadgeCreatorForm } from "@/components/badges/badge-creator-form";

export const dynamic = "force-dynamic";

export default async function BadgeCreatePage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return <BadgeCreatorForm />;
}
