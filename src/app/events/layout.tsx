export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh w-full max-w-none">{children}</div>;
}
