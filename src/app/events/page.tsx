import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

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

  return (
    <div className="min-h-dvh w-full bg-[radial-gradient(ellipse_at_top,_#2a1845_0%,_#12101a_38%,_#080810_100%)] text-white">
      <div className="mx-auto w-full px-4 pb-12 pt-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-block rounded-full border border-violet-500/30 px-3 py-1 text-xs text-violet-300">
              Użytkownik
            </p>
            <h1 className="text-[2rem] font-bold leading-tight text-white">
              Wydarzenia
            </h1>
            <p className="mt-2 text-base text-zinc-400">
              Zalogowany jako {user.email ?? profile?.email}
            </p>
          </div>
          <SignOutButton className="mt-0 shrink-0" />
        </div>

        <p className="text-lg text-zinc-400">
          Tu będzie lista eventów do przeglądania. Wygląd z Figmy dodamy w
          kolejnym kroku.
        </p>
      </div>
    </div>
  );
}
