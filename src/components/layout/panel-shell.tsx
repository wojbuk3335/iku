import { SignOutButton } from "@/components/auth/sign-out-button";

type PanelShellProps = {
  title: string;
  email: string;
  roleLabel: string;
  description: string;
  footer?: React.ReactNode;
};

export function PanelShell({
  title,
  email,
  roleLabel,
  description,
  footer,
}: PanelShellProps) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#0a0612] px-6 text-white">
      <p className="mb-4 rounded-full border border-violet-500/30 px-3 py-1 text-xs text-violet-300">
        {roleLabel}
      </p>
      <h1 className="text-3xl font-bold text-violet-200">{title}</h1>
      <p className="mt-3 text-violet-200/70">Zalogowany jako {email}</p>
      <p className="mt-6 max-w-md text-center text-sm text-violet-200/50">
        {description}
      </p>
      {footer}
      <SignOutButton />
    </main>
  );
}
