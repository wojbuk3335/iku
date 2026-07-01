export type UserRole = "user" | "admin" | "creator";

export type Profile = {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  onboarding_completed: boolean;
  interests: string[];
  bio: string | null;
  avatar_url: string | null;
  full_name: string | null;
};
