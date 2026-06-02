"use client";

import { useState } from "react";
import { redirectAfterClientLogin } from "@/lib/auth/redirect-after-client-login";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "rounded-2xl border border-violet-500/20 bg-[#2a1845]/80 px-4 py-4 text-base text-white placeholder:text-violet-200/40 outline-none focus:border-violet-400/50";

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
      className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4.5 text-base font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      {icon}
      {label}
    </button>
  );
}

export function LoginButtons() {
  const supabase = createClient();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMode, setEmailMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function redirectAfterLogin(userId: string) {
    await redirectAfterClientLogin(supabase, userId);
  }

  async function signInWithProvider(provider: "google" | "github") {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(getAuthErrorMessage(error.message));
      setLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (!email) {
      setMessage("Najpierw wpisz swój email.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setMessage(getAuthErrorMessage(error.message));
      return;
    }

    setMessage(
      "Wysłaliśmy link do ustawienia hasła. Kliknij go od razu — link wygasa po ok. 1 godzinie.",
    );
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
      {showEmailForm ? (
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
            autoComplete={
              emailMode === "login" ? "current-password" : "new-password"
            }
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-4 text-base font-medium text-white disabled:opacity-60"
          >
            {loading
              ? "Proszę czekać…"
              : emailMode === "login"
                ? "Zaloguj"
                : "Utwórz konto"}
          </button>
          {emailMode === "login" && (
            <button
              type="button"
              onClick={sendPasswordReset}
              disabled={loading}
              className="text-sm text-violet-200/60"
            >
              Zapomniałeś hasła?
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setEmailMode(emailMode === "login" ? "register" : "login")
            }
            className="text-sm text-violet-200/60"
          >
            {emailMode === "login"
              ? "Nie masz konta? Zarejestruj się"
              : "Masz konto? Zaloguj się"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowEmailForm(false);
              setEmailMode("login");
              setPassword("");
              setMessage(null);
            }}
            className="text-sm text-violet-200/60"
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
            label="Kontynuuj z GitHub"
            onClick={() => signInWithProvider("github")}
            disabled={loading}
          />
          <LoginButton
            icon={<GoogleIcon />}
            label="Kontynuuj z Google"
            variant="google"
            onClick={() => signInWithProvider("google")}
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
