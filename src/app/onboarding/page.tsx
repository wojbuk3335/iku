import { redirect } from "next/navigation";
import { InterestsPicker } from "@/components/onboarding/interests-picker";
import { getPostLoginPath } from "@/lib/auth/paths";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export default async function OnboardingPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/");
  }

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (profile?.onboarding_completed) {
    redirect(getPostLoginPath(profile.role, true));
  }

  return <InterestsPicker />;
}
