import Link from "next/link";

const steps = [
  {
    title: "Paste the chat",
    detail: "Drop the messy thread into one box. No accounts, no storage.",
  },
  {
    title: "Add context",
    detail: "Select your stage, who chases, and what you want out of this.",
  },
  {
    title: "Get the truth",
    detail: "Blunt, screenshot-ready cards: score, intent, red flags, next move.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(244,114,182,0.08),transparent_30%),#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16 lg:px-10 lg:py-20">
        <header className="flex flex-col gap-5">
          <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Blunt AI clarity
          </span>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Paste the texts. <span className="text-[var(--accent)]">Get the truth.</span>
          </h1>
          <p className="max-w-3xl text-lg text-[var(--muted)]">
            For women in the gray zone—dating, talking, or stuck in a situationship.
            Set up a profile for each person, keep adding chats, and watch how their
            signals shift over time.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/analyze"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[#0b0d10] shadow-[0_10px_40px_rgba(244,114,182,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
            >
              Create a profile
            </Link>
            <span className="text-sm text-[var(--muted)]">
              No sign-up · No storage · Under 60 seconds
            </span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--panel)] text-[var(--accent)]">
                  {idx + 1}
                </span>
                Step {idx + 1}
              </div>
              <h2 className="text-lg font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{step.detail}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-sm text-[var(--muted)] md:text-base">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[var(--foreground)]">For romantic uncertainty only.</p>
              <p>We call out breadcrumbing, low effort, and patterns—not feelings.</p>
            </div>
            <Link
              href="/analyze"
              className="w-fit rounded-full border border-[var(--accent)] px-4 py-2 text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-[#0b0d10]"
            >
              Start now
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
