"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AnalysisResult, decodeAnalysis, decodeResult } from "../../lib/analysis";
import { getProfileById } from "../../lib/profiles";

function ResultPageContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data") || undefined;

  const decoded = useMemo(() => {
    if (!dataParam) return null;
    return decodeResult(dataParam);
  }, [dataParam]);

  const legacyAnalysis = useMemo(() => {
    if (!dataParam) return null;
    return decodeAnalysis(dataParam);
  }, [dataParam]);

  const analysis = decoded?.analysis || legacyAnalysis;
  const profileId = decoded?.profileId;
  const profile = useMemo(() => {
    if (profileId) {
      return getProfileById(profileId);
    }
    return undefined;
  }, [profileId]);

  if (!analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-6">
        <div className="max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">
            No analysis found.
          </p>
          <p className="mt-2 text-[var(--muted)]">
            Create a profile and add a chat to see results.
          </p>
          <div className="mt-4">
            <Link
              href="/analyze"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0b0d10] hover:bg-[var(--accent-strong)]"
            >
              Go to profiles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const delta =
    decoded?.previous_score !== undefined
      ? Math.round(analysis.interest_score - decoded.previous_score)
      : null;
  const redFlagDelta =
    decoded?.previous_red_flags !== undefined
      ? analysis.signals.red_flags.length - decoded.previous_red_flags
      : null;

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(244,114,182,0.1),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(244,114,182,0.07),transparent_28%),#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 lg:px-10">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Result
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {profile ? `${profile.nickname}` : "Your read"}
          </h1>
          <p className="text-[var(--muted)]">
            Screenshot-ready cards. Blunt, pattern-first. Tracking change over time.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_14px_36px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Interest score</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-bold text-[var(--accent)]">
                    {Math.round(analysis.interest_score)}
                  </p>
                  {delta !== null && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        delta > 0
                          ? "bg-emerald-500/15 text-emerald-200"
                          : delta < 0
                            ? "bg-rose-500/15 text-rose-200"
                            : "bg-[var(--panel)] text-[var(--muted)]"
                      }`}
                    >
                      {delta > 0 ? `↑ ${delta}` : delta < 0 ? `↓ ${Math.abs(delta)}` : "—"}
                    </span>
                  )}
                </div>
              </div>
              <span className="rounded-full bg-[var(--panel)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                {analysis.intent_label}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoBlock title="Intent">
                <p className="text-[var(--muted)]">
                  {intentCopy(analysis.intent_label)}
                </p>
              </InfoBlock>
              <InfoBlock title="Power dynamic">
                <p className="text-[var(--muted)]">
                  {powerCopy(analysis.power_dynamic)}
                </p>
              </InfoBlock>
            </div>
          </div>

          <div className="space-y-4">
          <Card title="Signals" accent>
            <div className="grid gap-3 md:grid-cols-2">
              <List title="Green flags" items={analysis.signals.green_flags} />
              <List
                title="Red flags"
                items={analysis.signals.red_flags}
                variant="danger"
              />
            </div>
            {redFlagDelta !== null && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Red flags change: {redFlagDelta > 0 ? `+${redFlagDelta}` : redFlagDelta}
              </p>
            )}
          </Card>
            <Card title="Suggested reply">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                Tone: {analysis.suggested_reply.tone}
              </p>
              <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)]">
                {analysis.suggested_reply.text}
              </p>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card title="What it means">
            <List items={analysis.what_it_means} />
          </Card>
          <Card title="What to do next" accent>
            <List items={analysis.what_to_do_next} />
          </Card>
          <Card title="Share-worthy takeaway">
            <p className="text-sm text-[var(--muted)]">
              Pin these as the headline for your screenshot.
            </p>
            <List
              items={[
                intentCopy(analysis.intent_label),
                powerCopy(analysis.power_dynamic),
                `Score: ${Math.round(analysis.interest_score)}`,
                delta !== null ? `Change: ${delta > 0 ? "+" : ""}${delta}` : "",
              ].filter(Boolean) as string[]}
            />
          </Card>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            Not therapy. Pattern read of the messages you provided.
          </p>
          <div className="flex gap-2">
            <Link
              href={profile ? `/analyze?profileId=${profile.id}` : "/analyze"}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0b0d10] hover:bg-[var(--accent-strong)]"
            >
              Add new exchange
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm text-[var(--foreground)] hover:border-[var(--accent)]"
            >
              Back to start
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-6">
          <div className="h-64 w-full max-w-5xl rounded-2xl bg-[var(--panel)] animate-pulse" />
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}

function intentCopy(intent: AnalysisResult["intent_label"]) {
  const copy: Record<AnalysisResult["intent_label"], string> = {
    invested: "Showing consistent interest and forward momentum.",
    casual: "Light engagement without clear plans or depth.",
    breadcrumbing: "Low-effort pings to keep you engaged without moving forward.",
    avoidant: "Dodging closeness or plans; walls stay up.",
    using_attention: "Engagement appears transactional or ego-driven.",
    unclear: "Mixed or insufficient signals to call it.",
  };
  return copy[intent];
}

function powerCopy(power: AnalysisResult["power_dynamic"]) {
  const copy: Record<AnalysisResult["power_dynamic"], string> = {
    user_chasing: "You’re driving the conversation more than they are.",
    balanced: "Initiation and investment look fairly even.",
    other_chasing: "They are putting in more pursuit than you are.",
  };
  return copy[power];
}

function Card({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.25)] ${
        accent ? "bg-[var(--panel)]" : "bg-[var(--card)]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {accent && (
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        )}
      </div>
      {children}
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        {title}
      </p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

function List({
  title,
  items,
  variant,
}: {
  title?: string;
  items: string[];
  variant?: "danger";
}) {
  if (!items.length) {
    return <p className="text-sm text-[var(--muted)]">Nothing noted.</p>;
  }

  return (
    <div className="space-y-2">
      {title && (
        <p
          className={`text-sm font-semibold ${
            variant === "danger" ? "text-rose-200" : "text-[var(--foreground)]"
          }`}
        >
          {title}
        </p>
      )}
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={`${item}-${idx}`}
            className={`flex gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm ${
              variant === "danger"
                ? "bg-rose-500/10 text-rose-100"
                : "bg-[var(--panel)] text-[var(--foreground)]"
            }`}
          >
            <span className="text-[var(--accent)]">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
