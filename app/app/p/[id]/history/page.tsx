import { redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

type Params = { params: Promise<{ id: string }> };

export default async function HistoryPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const events = await prisma.profileEvent.findMany({
    where: { profileId: id, profile: { userId: session.user.id } },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">History</h1>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {event.type}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-[var(--muted)]">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          ))}
          {events.length === 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
              No events yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
