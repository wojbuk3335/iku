import { CreatorNav } from "@/components/admin/creator-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full max-w-none">
      <CreatorNav />
      {children}
    </div>
  );
}
