export function getAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit")) {
    return "Wysłano za dużo maili. Poczekaj ok. 1 godziny albo użyj rejestracji z hasłem (bez maila).";
  }

  if (lower.includes("invalid login credentials")) {
    return "Zły email lub hasło. Sprawdź dane albo ustaw hasło przez „Zapomniałeś hasła?”.";
  }

  if (lower.includes("email not confirmed")) {
    return "Potwierdź email — sprawdź skrzynkę albo wyłącz „Confirm email” w Supabase (Authentication → Providers → Email).";
  }

  if (lower.includes("user already registered")) {
    return "Ten email jest już zarejestrowany. Użyj „Zaloguj” zamiast rejestracji.";
  }

  if (lower.includes("oauth") || lower.includes("provider")) {
    return "Logowanie przez GitHub/Google nie jest skonfigurowane. Sprawdź ustawienia w Supabase.";
  }

  return message;
}

export function getAuthCallbackErrorMessage(reason: string | null): string | null {
  if (!reason) {
    return "Logowanie nie powiodło się. Spróbuj ponownie.";
  }

  return getAuthErrorMessage(decodeURIComponent(reason));
}
