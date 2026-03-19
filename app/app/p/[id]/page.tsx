import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { flows } from "../../../../lib/flows";

type Params = { params: Promise<{ id: string }> };

export default async function ProfileHome({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const profile = await prisma.personProfile.findFirst({
    where: { id, userId: session.user.id },
    include: { events: { orderBy: { timestamp: "desc" }, take: 20 }, state: true },
  });
  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Profile</p>
            <h1 className="text-3xl font-semibold">{profile.displayName}</h1>
            <p className="text-sm text-[var(--muted)]">{profile.tags.join(", ")}</p>
          </div>
          <Link
            href={`/app/p/${profile.id}/flow/status`}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0b0d10]"
          >
            Quick check-in
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {flows.slice(0, 3).map((flow) => (
            <Link
              key={flow.key}
              href={`/app/p/${profile.id}/flow/${flow.key}`}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--accent)]"
            >
              <p className="text-sm text-[var(--muted)]">Flow</p>
              <h3 className="text-lg font-semibold">{flow.name}</h3>
              <p className="text-xs text-[var(--muted)]">2-3 taps per step</p>
            </Link>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">History</h2>
            <Link href={`/app/p/${profile.id}/history`} className="text-sm text-[var(--accent)]">
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {profile.events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {event.type}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <pre className="mt-2 text-xs text-[var(--muted)] whitespace-pre-wrap">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            ))}
            {profile.events.length === 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
                No events yet. Run a flow to add the first checkpoint.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
