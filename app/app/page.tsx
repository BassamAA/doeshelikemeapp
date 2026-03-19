import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { maxProfilesForPlan } from "../../lib/entitlements";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const profiles = await prisma.personProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const ent = await prisma.entitlement.findUnique({ where: { userId: session.user.id } });
  const plan = ent?.planType ?? "FREE";
  const maxProfiles = maxProfilesForPlan(plan);

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Dashboard</p>
            <h1 className="text-3xl font-semibold">Profiles</h1>
            <p className="text-sm text-[var(--muted)]">
              Plan: {plan} • {profiles.length}/{maxProfiles} profiles
            </p>
          </div>
          <Link
            href="/app/new-profile"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0b0d10]"
          >
            Create new person
          </Link>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/app/p/${p.id}`}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.25)] hover:border-[var(--accent)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{p.displayName}</p>
                  <p className="text-sm text-[var(--muted)]">{p.tags?.join(", ") || "No tags"}</p>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {profiles.length === 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-[var(--muted)]">
              No profiles yet. Create your first person to start a flow.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
