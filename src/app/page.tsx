import { LoginButtons } from "@/components/auth/login-buttons";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-[radial-gradient(ellipse_at_center,_#4a2878_0%,_#1a0f2e_45%,_#0a0612_100%)]">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <h1 className="text-5xl font-bold tracking-wide text-violet-200">IKU</h1>
        <p className="mt-3 text-sm text-violet-200/70">
          Odkrywaj wydarzenia, łącz się z ludźmi
        </p>

        <LoginButtons />
      </div>

      <p className="px-6 pb-8 text-center text-xs leading-relaxed text-violet-200/40">
        Kontynuując, akceptujesz nasz{" "}
        <span className="text-violet-200/60">Regulamin</span> i{" "}
        <span className="text-violet-200/60">Politykę Prywatności</span>
      </p>
    </main>
  );
}
