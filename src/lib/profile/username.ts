/** Normalizacja i walidacja publicznego username. */

const USERNAME_RE = /^[a-z0-9]([a-z0-9._]*[a-z0-9])?$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

export function isValidUsername(username: string): boolean {
  if (username.length < 3 || username.length > 30) return false;
  if (username.includes("..") || username.includes("__")) return false;
  return USERNAME_RE.test(username);
}

export function usernameFromEmail(email: string | null | undefined, userId: string): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = normalizeUsername(local.replace(/[^a-zA-Z0-9._]/g, ""));
  if (cleaned.length >= 3) return cleaned.slice(0, 30);
  return `user_${userId.replace(/-/g, "").slice(0, 8)}`;
}
