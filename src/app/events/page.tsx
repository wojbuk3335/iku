import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#0a0612] px-6 text-white">
      <h1 className="text-3xl font-bold text-violet-200">Wydarzenia</h1>
      <p className="mt-3 text-violet-200/70">
        Jesteś zalogowany jako {user.email}
      </p>
      <p className="mt-6 text-sm text-violet-200/50">
        Tu będzie lista eventów — dodamy ją w następnym kroku.
      </p>
    </main>
  );
}
