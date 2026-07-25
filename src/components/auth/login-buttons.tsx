"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { redirectAfterClientLogin } from "@/lib/auth/redirect-after-client-login";
import {
  getAuthCallbackErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors";
import {
  birthDateInputBounds,
  isValidBirthDate,
} from "@/lib/profile/birth-date";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "rounded-2xl border border-violet-500/20 bg-[#2a1845]/80 px-4 py-4 text-base text-white placeholder:text-violet-200/40 outline-none focus:border-violet-400/50 [color-scheme:dark]";

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      aria-hidden
    >
      <path
        fill="#fff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#fff"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#fff"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#fff"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginButton({
  icon,
  label,
  variant = "dark",
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "dark" | "google";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles =
    variant === "google"
      ? "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400"
      : "border border-violet-500/20 bg-[#2a1845]/80 hover:bg-[#352055]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl px-6 py-4.5 text-base font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────
// ─── Password strength helpers ───────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "length",  label: "Min. 5 znaków",       test: (p: string) => p.length >= 5 },
  { id: "upper",   label: "Jedna wielka litera",  test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit",   label: "Jedna cyfra",          test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "Jeden znak specjalny", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(p: string) {
  return PASSWORD_RULES.filter((r) => r.test(p)).length;
}

const STRENGTH_LABELS = ["", "Słabe", "Słabe", "Średnie", "Silne"];
const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

function isEmailValid(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function RegisterForm({ onBack }: { onBack: () => void }) {
  const supabase = createClient();
  const [role,       setRole]      = useState<"user" | "creator">("user");
  const [firstName,  setFirstName] = useState("");
  const [lastName,   setLastName]  = useState("");
  const [orgName,    setOrgName]   = useState("");
  const [birthDate,  setBirthDate] = useState("");
  const [email,      setEmail]     = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password,   setPassword]  = useState("");
  const [confirm,    setConfirm]   = useState("");
  const [message,    setMessage]   = useState<string | null>(null);
  const [isPending,  startTransition] = useTransition();

  const strength     = getStrength(password);
  const passwordValid = strength === 4;
  const emailError   = emailTouched && email && !isEmailValid(email);
  const dateBounds   = birthDateInputBounds();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setEmailTouched(true);

    if (!isEmailValid(email))  { setMessage("Podaj poprawny adres email."); return; }
    if (!birthDate || !isValidBirthDate(birthDate)) {
      setMessage("Podaj poprawną datę urodzenia (min. 13 lat).");
      return;
    }
    if (!passwordValid)        { setMessage("Hasło nie spełnia wymagań bezpieczeństwa."); return; }
    if (password !== confirm)  { setMessage("Hasła nie są identyczne."); return; }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setMessage(getAuthErrorMessage(error.message)); return; }
      if (!data.user) { setMessage("Nie udało się utworzyć konta."); return; }

      // Upsert profile with chosen role directly via client (own row — RLS allows it)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id:                   data.user.id,
        full_name:            fullName || null,
        birth_date:           birthDate,
        role,
        onboarding_completed: true,
        ...(orgName.trim() ? { bio: orgName.trim() } : {}),
      });
      if (profileError) { setMessage(profileError.message); return; }

      await redirectAfterClientLogin(supabase, data.user.id);
    });
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-3">

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-2">
        {(["user", "creator"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className="flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-4 transition-all"
            style={{
              borderColor: role === r ? "rgba(139,92,246,0.8)" : "rgba(139,92,246,0.2)",
              background:  role === r ? "rgba(109,40,217,0.25)" : "rgba(42,24,69,0.5)",
            }}
          >
            <span className="text-xl">{r === "user" ? "👤" : "🎯"}</span>
            <span className="text-sm font-semibold text-white">
              {r === "user" ? "Użytkownik" : "Twórca"}
            </span>
            <span className="text-center text-[10px] leading-tight text-violet-300/60">
              {r === "user"
                ? "Odkrywaj i uczestnicz w wydarzeniach"
                : "Twórz i zarządzaj wydarzeniami"}
            </span>
          </button>
        ))}
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Imię"
          className={inputClassName}
          autoComplete="given-name"
        />
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Nazwisko"
          className={inputClassName}
          autoComplete="family-name"
        />
      </div>

      {/* Creator extra field */}
      {role === "creator" && (
        <input
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Nazwa firmy / organizacji (opcjonalnie)"
          className={inputClassName}
          autoComplete="organization"
        />
      )}

      {/* Birth date */}
      <div className="flex flex-col gap-1">
        <label className="px-1 text-xs text-violet-200/50">Data urodzenia</label>
        <input
          type="date"
          required
          value={birthDate}
          min={dateBounds.min}
          max={dateBounds.max}
          onChange={(e) => setBirthDate(e.target.value)}
          className={inputClassName}
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          placeholder="twój@email.com"
          className={inputClassName + (emailError ? " border-red-500/60" : "")}
          autoComplete="email"
        />
        {emailError && (
          <p className="px-1 text-xs text-red-400">Podaj poprawny adres email (np. jan@example.com)</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
          className={inputClassName}
          autoComplete="new-password"
        />

        {/* Strength bar */}
        {password.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width:      `${(strength / 4) * 100}%`,
                  background: STRENGTH_COLORS[strength] || "transparent",
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: STRENGTH_COLORS[strength] }}>
                {STRENGTH_LABELS[strength]}
              </span>
              <span className="text-xs text-violet-200/40">{strength}/4</span>
            </div>
            {/* Rules checklist */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <div key={rule.id} className="flex items-center gap-1.5">
                    <span className="text-[10px]" style={{ color: ok ? "#22c55e" : "#52525b" }}>
                      {ok ? "✓" : "○"}
                    </span>
                    <span className="text-[10px]" style={{ color: ok ? "#86efac" : "#52525b" }}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1">
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Powtórz hasło"
          className={inputClassName + (confirm && confirm !== password ? " border-red-500/60" : confirm && confirm === password ? " border-green-500/40" : "")}
          autoComplete="new-password"
        />
        {confirm && confirm !== password && (
          <p className="px-1 text-xs text-red-400">Hasła nie są identyczne</p>
        )}
        {confirm && confirm === password && (
          <p className="px-1 text-xs text-green-400">✓ Hasła są zgodne</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !passwordValid || (!!confirm && confirm !== password)}
        className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-4 text-base font-medium text-white disabled:opacity-60 transition-opacity"
      >
        {isPending ? "Tworzę konto…" : `Załóż konto ${role === "user" ? "użytkownika" : "twórcy"}`}
      </button>

      {message && (
        <p className="text-center text-sm text-violet-200/80">{message}</p>
      )}

      <button type="button" onClick={onBack} className="text-sm text-violet-200/60 hover:text-violet-200/80 transition-colors">
        ← Wróć
      </button>
    </form>
  );
}

// ─── Register icon ────────────────────────────────────────────────────────────
function UserPlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}

export function LoginButtons() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [showEmailForm, setShowEmailForm]       = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showResetForm, setShowResetForm]       = useState(false);
  const [resetEmail, setResetEmail]             = useState("");
  const [resetSent, setResetSent]               = useState(false);
  const [emailMode, setEmailMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.has("code")) {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.search = searchParams.toString();
      window.location.replace(callback.toString());
      return;
    }

    if (searchParams.get("error") !== "auth") {
      return;
    }

    setMessage(
      getAuthCallbackErrorMessage(searchParams.get("reason")),
    );
  }, [searchParams]);

  async function redirectAfterLogin(userId: string) {
    await redirectAfterClientLogin(supabase, userId);
  }

  async function signInWithProvider(provider: "google" | "github") {
    setLoading(true);
    setOauthProvider(provider);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(getAuthErrorMessage(error.message));
      setLoading(false);
      setOauthProvider(null);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
    }
  }

  async function sendPasswordReset() {
    if (!resetEmail.trim()) { setMessage("Wpisz swój adres email."); return; }

    setLoading(true);
    setMessage(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo });

    setLoading(false);

    if (error) { setMessage(getAuthErrorMessage(error.message)); return; }

    setResetSent(true);
    setMessage(null);
  }

  async function signInWithEmail(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (emailMode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(getAuthErrorMessage(error.message));
        setLoading(false);
        return;
      }

      if (data.user) {
        await redirectAfterLogin(data.user.id);
      }

      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(getAuthErrorMessage(error.message));
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      await redirectAfterLogin(data.user.id);
      setLoading(false);
      return;
    }

    setMessage("Konto utworzone. Możesz się teraz zalogować.");
    setEmailMode("login");
    setLoading(false);
  }

  return (
    <div className="mt-10 flex w-full max-w-md flex-col gap-4">
      {showRegisterForm ? (
        <RegisterForm onBack={() => setShowRegisterForm(false)} />
      ) : showResetForm ? (
        /* ── Reset password screen ── */
        <div className="flex flex-col gap-3">
          {resetSent ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-500/20 bg-[#2a1845]/50 px-6 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20 text-3xl">
                ✉️
              </div>
              <div>
                <p className="text-base font-semibold text-white">Sprawdź skrzynkę</p>
                <p className="mt-1 text-sm text-violet-200/60">
                  Wysłaliśmy link do resetowania hasła na adres{" "}
                  <span className="text-violet-300">{resetEmail}</span>.
                  Link wygasa po ok. 1 godzinie.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-violet-200/60">
                Podaj swój adres email — wyślemy link do ustawienia nowego hasła.
              </p>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="twój@email.com"
                className={inputClassName}
                autoComplete="email"
                autoFocus
              />
              <button
                type="button"
                disabled={loading}
                onClick={sendPasswordReset}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-4 text-base font-medium text-white disabled:opacity-60"
              >
                {loading ? "Wysyłam…" : "Wyślij link resetujący"}
              </button>
              {message && <p className="text-center text-sm text-red-400">{message}</p>}
            </>
          )}
          <button
            type="button"
            onClick={() => { setShowResetForm(false); setResetSent(false); setResetEmail(""); setMessage(null); }}
            className="text-sm text-violet-200/60 hover:text-violet-200/80 transition-colors"
          >
            ← Wróć do logowania
          </button>
        </div>
      ) : showEmailForm ? (
        <form onSubmit={signInWithEmail} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="twój@email.com"
            className={inputClassName}
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Hasło (min. 6 znaków)"
            className={inputClassName}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-4 text-base font-medium text-white disabled:opacity-60"
          >
            {loading ? "Proszę czekać…" : "Zaloguj"}
          </button>
          <button
            type="button"
            onClick={() => { setShowResetForm(true); setShowEmailForm(false); setMessage(null); }}
            disabled={loading}
            className="text-sm text-violet-200/60 hover:text-violet-200/80 transition-colors"
          >
            Zapomniałeś hasła?
          </button>
          <button
            type="button"
            onClick={() => { setShowEmailForm(false); setEmailMode("login"); setPassword(""); setMessage(null); }}
            className="text-sm text-violet-200/60 hover:text-violet-200/80 transition-colors"
          >
            Wróć
          </button>
        </form>
      ) : (
        <>
          <LoginButton
            icon={<MailIcon />}
            label="Kontynuuj z Email"
            onClick={() => setShowEmailForm(true)}
            disabled={loading}
          />
          <LoginButton
            icon={<GitHubIcon />}
            label={
              oauthProvider === "github"
                ? "Przekierowanie do GitHub…"
                : "Kontynuuj z GitHub"
            }
            onClick={() => signInWithProvider("github")}
            disabled={loading}
          />
          <LoginButton
            icon={<GoogleIcon />}
            label={
              oauthProvider === "google"
                ? "Przekierowanie do Google…"
                : "Kontynuuj z Google"
            }
            variant="google"
            onClick={() => signInWithProvider("google")}
            disabled={loading}
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-violet-500/15" />
            <span className="text-xs text-violet-200/40">lub</span>
            <div className="h-px flex-1 bg-violet-500/15" />
          </div>

          <LoginButton
            icon={<UserPlusIcon />}
            label="Załóż konto"
            onClick={() => setShowRegisterForm(true)}
            disabled={loading}
          />
        </>
      )}

      {message && (
        <p className="text-center text-sm text-violet-200/80">{message}</p>
      )}
    </div>
  );
}
