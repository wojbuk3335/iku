import type { UserRole } from "@/types/profile";

export function getPostLoginPath(
  role: UserRole,
  onboardingCompleted: boolean,
): string {
  if (role === "admin") {
    return "/admin";
  }

  if (!onboardingCompleted) {
    return "/onboarding";
  }

  return "/events";
}

/** @deprecated Użyj getPostLoginPath — zostawione dla prostych przekierowań admin/user. */
export function getHomePathForRole(role: UserRole): string {
  return getPostLoginPath(role, true);
}
