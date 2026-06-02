export type UserRole = "user" | "admin" | "creator";

export type Profile = {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  onboarding_completed: boolean;
  interests: string[];
};
