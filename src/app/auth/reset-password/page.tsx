import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-[radial-gradient(ellipse_at_center,_#4a2878_0%,_#1a0f2e_45%,_#0a0612_100%)]">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-bold text-violet-200">Nowe hasło</h1>
        <p className="mt-3 max-w-sm text-center text-sm text-violet-200/70">
          Ustaw nowe hasło do swojego konta IKU.
        </p>
        <ResetPasswordForm />
        <Link
          href="/"
          className="mt-6 text-sm text-violet-200/60 hover:text-violet-200"
        >
          Wróć do logowania
        </Link>
      </div>
    </main>
  );
}
