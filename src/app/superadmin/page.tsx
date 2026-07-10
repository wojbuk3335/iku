import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminPanel } from "@/components/superadmin/superadmin-panel";

export const dynamic = "force-dynamic";

export type AdminUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  is_blocked: boolean;
  blocked_reason: string | null;
};

async function getAllUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, created_at, is_blocked, blocked_reason")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllUsers:", error.message);
    return [];
  }

  return (data ?? []) as AdminUser[];
}

export default async function SuperAdminPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin") redirect("/events");

  const users = await getAllUsers();

  return <SuperAdminPanel users={users} currentUserId={user.id} />;
}
