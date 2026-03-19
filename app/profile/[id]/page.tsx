"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalysisResult } from "../../../lib/analysis";
import {
  computeRisk,
  RomanticProfile,
  getProfileById,
  TrendDeltas,
} from "../../../lib/profiles";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  const [profile, setProfile] = useState<RomanticProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    const p = getProfileById(profileId);
    if (!p) {
      notFound();
      return;
    }
    if (p.checkpoints?.[0]?.analysis) {
      p.risk_level = computeRisk(p.checkpoints[0].analysis);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(p);
    setMounted(true);
  }, [profileId]);

  if (!mounted || !profile) {
    return (
      <div className="relative min-h-screen bg-[#0b0d10]">
        <main className="mx-auto max-w-5xl px-6 py-12">
          <div className="h-8 w-48 rounded-full bg-[var(--panel)] animate-pulse" />
          <div className="mt-4 h-64 rounded-2xl bg-[var(--panel)] animate-pulse" />
        </main>
      </div>
    );
  }

  const latest = profile.checkpoints[0];
  const trendArrow = latest?.deltas?.trend_arrow || "flat";
  const delta = latest?.deltas?.interest_delta ?? null;

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(244,114,182,0.1),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(244,114,182,0.07),transparent_28%),#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Profile
            </p>
            <h1 className="text-3xl font-semibold">{profile.nickname}</h1>
            <p className="text-sm text-[var(--muted)]">
              {profile.relationship_stage} • {profile.user_goal}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/analyze?profileId=${profile.id}`}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0b0d10] hover:bg-[var(--accent-strong)]"
            >
              Add update
            </Link>
            <button
              onClick={() => router.push(`/result?data=${encodeURIComponent("")}`)}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm text-[var(--foreground)] hover:border-[var(--accent)]"
            >
              Share cards (soon)
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <StatusStrip
            score={latest?.analysis?.interest_score}
            delta={delta}
            trend={trendArrow}
            risk={profile.risk_level}
            clarityWindow={profile.clarity_window_days || 21}
          />
          <MetaCard profile={profile} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <p className="text-xs text-[var(--muted)]">
              Tracking change over time (checkpoints)
            </p>
          </div>
          {profile.checkpoints.length === 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
              No checkpoints yet. Add an update to start tracking.
            </div>
          )}
          <div className="space-y-4">
            {profile.checkpoints.map((cp) => (
              <CheckpointCard key={cp.id} checkpoint={cp} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusStrip({
  score,
  delta,
  trend,
  risk,
  clarityWindow,
}: {
  score?: number;
  delta: number | null;
  trend: "up" | "down" | "flat";
  risk?: "low" | "medium" | "high";
  clarityWindow?: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">Current score</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-[var(--accent)]">
              {score ?? "—"}
            </p>
            {delta !== null && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  delta > 0
                    ? "bg-emerald-500/15 text-emerald-200"
                    : delta < 0
                      ? "bg-rose-500/15 text-rose-200"
                      : "bg-[var(--card)] text-[var(--muted)]"
                }`}
              >
                {delta > 0 ? `↑ ${delta}` : delta < 0 ? `↓ ${Math.abs(delta)}` : "→ 0"}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge label="Trend" value={trendSymbol(trend)} />
          <Badge label="Risk" value={risk || "n/a"} tone={risk} />
          <Badge label="Clarity window" value={`${clarityWindow ?? 21} days`} />
        </div>
      </div>
    </div>
  );
}

function MetaCard({ profile }: { profile: RomanticProfile }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.25)]">
      <h3 className="text-lg font-semibold">Context</h3>
      <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
        <Row label="Stage" value={profile.relationship_stage} />
        <Row label="Who initiates" value={profile.initiator || "—"} />
        <Row label="Typical reply time" value={profile.reply_time || "—"} />
        <Row label="Hot–cold pattern" value={profile.hot_cold_pattern || "—"} />
        <Row label="Summary" value={profile.context_summary || "Add a note in the future update"} />
      </div>
    </div>
  );
}

function CheckpointCard({ checkpoint }: { checkpoint: RomanticProfile["checkpoints"][number] }) {
  const analysis = checkpoint.analysis as AnalysisResult | undefined;
  const deltas: TrendDeltas | undefined = checkpoint.deltas;
  const interestDelta = deltas?.interest_delta;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-[var(--muted)]">
            {checkpoint.answers.label || "Checkpoint"} •{" "}
            {new Date(checkpoint.timestamp).toLocaleString()}
          </p>
          {checkpoint.answers.note && (
            <p className="text-sm text-[var(--foreground)]">
              {checkpoint.answers.note}
            </p>
          )}
        </div>
        {analysis && (
          <div className="flex items-center gap-3">
            <Badge label="Score" value={`${Math.round(analysis.interest_score)}`} />
            {interestDelta !== null && interestDelta !== undefined && (
              <Badge
                label="Δ"
                value={interestDelta}
                tone={
                  interestDelta < 0
                    ? "high"
                    : interestDelta > 0
                      ? "low"
                      : undefined
                }
              />
            )}
          </div>
        )}
      </div>
      {analysis && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <List title="Most likely pattern" items={[checkpoint.pattern_label || "—"]} />
          <List
            title="Next move"
            items={[
              checkpoint.next_move
                ? moveCopy(checkpoint.next_move)
                : "Choose: Ask / Pull back / Wait",
              checkpoint.horizon_days && checkpoint.horizon_expectation
                ? `If nothing changes in ${checkpoint.horizon_days} days: ${checkpoint.horizon_expectation}`
                : "",
            ].filter(Boolean)}
          />
        </div>
      )}
      {analysis && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <List title="Green flags" items={analysis.signals.green_flags} />
          <List title="Red flags" items={analysis.signals.red_flags} />
          <List title="What to do next" items={analysis.what_to_do_next} />
        </div>
      )}
    </div>
  );
}

function Badge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "low" | "medium" | "high";
}) {
  const toneClass =
    tone === "high"
      ? "bg-rose-500/15 text-rose-100 border border-rose-500/40"
      : tone === "medium"
        ? "bg-amber-500/15 text-amber-100 border border-amber-500/40"
        : tone === "low"
          ? "bg-emerald-500/15 text-emerald-100 border border-emerald-500/30"
          : "bg-[var(--panel)] text-[var(--foreground)] border border-[var(--border)]";
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      <span className="uppercase tracking-[0.15em] text-[var(--muted)]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{title}</p>
      <ul className="mt-2 space-y-2 text-sm">
        {items.length === 0 ? (
          <li className="text-[var(--muted)]">—</li>
        ) : (
          items.map((item, idx) => (
            <li key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2">
              {item}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function trendSymbol(trend: "up" | "down" | "flat") {
  if (trend === "up") return "↑ improving";
  if (trend === "down") return "↓ slipping";
  return "→ steady";
}

function moveCopy(move: "ask" | "pull_back" | "wait") {
  if (move === "ask") return "Ask for clarity";
  if (move === "pull_back") return "Pull back";
  return "Wait and watch";
}
