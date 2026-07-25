import { redirect } from "next/navigation";

/** Lista wydarzeń przeniesiona do Statystyki → Moje Events. */
export default function CreatorEventsRedirectPage() {
  redirect("/admin/stats?tab=events");
}
