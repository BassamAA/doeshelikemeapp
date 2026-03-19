"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AnalysisResult,
  encodeResult,
  EncodedResult,
} from "../../lib/analysis";
import {
  addCheckpoint,
  createProfile,
  FunnelAnswers,
  getProfiles,
  RomanticProfile,
} from "../../lib/profiles";
import { canAddCheckpoint, canCreateProfile, getEntitlement } from "../../lib/paywall";

const stageOptions = ["Talking", "Dating", "Ex", "Situationship"];
const goalOptions = ["Clarity", "Relationship", "Closure"];
const initiatorOptions = ["Me", "Them", "About equal"];
const consistencyOptions = [
  "Fast and steady",
  "Usually quick but slips",
  "Slow and spotty",
  "All over the place",
];
const hotColdOptions = [
  "No, mostly steady",
  "Sometimes warm then cold",
  "Very hot–cold swings",
  "Unsure",
];

function AnalyzePageContent() {
  const router = useRouter();
  const search = useSearchParams();
  const resumeProfileId = search.get("profileId") || undefined;

  const [profiles, setProfiles] = useState<RomanticProfile[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [nickname, setNickname] = useState("");
  const [stage, setStage] = useState(stageOptions[0]);
  const [goal, setGoal] = useState(goalOptions[0]);

  const [answers, setAnswers] = useState<FunnelAnswers>({
    initiator: initiatorOptions[1],
    consistency: consistencyOptions[1],
    hotCold: hotColdOptions[1],
    recentExchange: "",
    recentChange: "",
    label: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProfile = profiles.find((p) => p.id === profileId) || null;
  const lastScore = currentProfile?.current_interest_score;
  const lastRedFlags =
    currentProfile?.checkpoints?.[0]?.analysis?.signals.red_flags.length ?? undefined;
  const entitlement = getEntitlement();
  const profileLimitReached =
    !currentProfile && !canCreateProfile(profiles.length, entitlement);
  const checkpointLimitReached =
    currentProfile &&
    !canAddCheckpoint(currentProfile.id, currentProfile.checkpoints?.length || 0, entitlement);

  useEffect(() => {
    if (mounted) return;
    const loaded = getProfiles();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(loaded);
    if (resumeProfileId && loaded.some((p) => p.id === resumeProfileId)) {
      setProfileId(resumeProfileId);
    } else if (loaded.length) {
      setProfileId(loaded[0].id);
    }
    setMounted(true);
  }, [mounted, resumeProfileId]);

  const canSubmit = useMemo(() => {
    return (
      !!currentProfile &&
      answers.recentExchange.trim().length > 20 &&
      !loading
    );
  }, [currentProfile, answers.recentExchange, loading]);

  function handleCreateProfile(e: FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    if (profileLimitReached) {
      setPaywallMessage("Free limit reached. Unlock another profile to continue.");
      return;
    }
    const profile = createProfile({
      nickname: nickname.trim(),
      relationship_stage: stage,
      user_goal: goal,
    });
    const updated = getProfiles();
    setProfiles(updated);
    setProfileId(profile.id);
    setNickname("");
    setCreating(false);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || !currentProfile) return;
    if (checkpointLimitReached) {
      setPaywallMessage("Unlock more checkpoints for this person to continue.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      chat: answers.recentExchange,
      stage: currentProfile.relationship_stage,
      initiator: answers.initiator,
      goal: currentProfile.user_goal,
      profile: {
        id: currentProfile.id,
        nickname: currentProfile.nickname,
        relationship_stage: currentProfile.relationship_stage,
        user_goal: currentProfile.user_goal,
      },
      context: {
        consistency: answers.consistency,
        hotCold: answers.hotCold,
        recentChange: answers.recentChange,
        last_interest_score: lastScore ?? null,
      },
      history: currentProfile.checkpoints
        .slice(0, 3)
        .filter((i) => i.analysis)
        .map((i) => ({
          score: i.analysis?.interest_score,
          intent: i.analysis?.intent_label,
          power: i.analysis?.power_dynamic,
          timestamp: i.timestamp,
        })),
    };

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to analyze");
        const data: AnalysisResult = await res.json();
        const interactionId = crypto.randomUUID();
        addCheckpoint(currentProfile.id, {
          id: interactionId,
          timestamp: Date.now(),
          answers,
          analysis: data,
        });
        const updatedProfiles = getProfiles();
        setProfiles(updatedProfiles);
        const encoded = encodeResult({
          analysis: data,
          profileId: currentProfile.id,
          interactionId,
          previous_score: lastScore ?? undefined,
          previous_red_flags: lastRedFlags,
        } as EncodedResult);
        router.push(`/result?data=${encoded}`);
      })
      .catch((err) => {
        console.error(err);
        setError("We hit a snag. Please tweak the inputs and try again.");
      })
      .finally(() => setLoading(false));
  }

  if (!mounted) {
    return (
      <div className="relative min-h-screen bg-[#0b0d10]">
        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 lg:px-10">
          <div className="h-6 w-32 rounded-full bg-[var(--panel)] animate-pulse" />
          <div className="h-10 w-64 rounded-full bg-[var(--panel)] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[var(--panel)] animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_10%_15%,rgba(244,114,182,0.09),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(244,114,182,0.05),transparent_25%),#0b0d10]">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 lg:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Guided analysis
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            One profile per person.{" "}
            <span className="text-[var(--accent)]">Track the shift.</span>
          </h1>
          <p className="max-w-2xl text-[var(--muted)]">
            Create a profile for each romantic person. Add new exchanges over time
            and see how interest moves.
          </p>
        </header>

        <section className="grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Profiles
              </p>
              <p className="text-sm text-[var(--muted)]">
                One profile per person. Pay-gating ready later.
              </p>
            </div>
            <button
              className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#0b0d10]"
              onClick={() => setCreating((v) => !v)}
            >
              {creating ? "Cancel" : "New profile"}
            </button>
          </div>

          {profileLimitReached && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Free tier allows one profile. Unlock another profile to continue.
            </div>
          )}
          {paywallMessage && (
            <PaywallNotice
              message={paywallMessage}
              onClose={() => setPaywallMessage(null)}
              onCheckout={async () => {
                const res = await fetch("/api/checkout", { method: "POST" });
                const data = await res.json();
                if (data.checkoutUrl) window.open(data.checkoutUrl, "_blank");
              }}
            />
          )}

          {profiles.length > 0 && !creating && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Choose a profile
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProfileId(p.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      profileId === p.id
                        ? "border-[var(--accent)] bg-[var(--panel)]"
                        : "border-[var(--border)] bg-[var(--panel)]/60 hover:border-[var(--accent)]/60"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{p.nickname}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {p.relationship_stage} • {p.user_goal}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--muted)] text-xs">Current score</p>
                      <p className="text-lg font-semibold text-[var(--accent)]">
                        {p.current_interest_score ?? "—"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {creating && (
            <form
              className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
              onSubmit={handleCreateProfile}
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[var(--foreground)]">
                  Nickname
                </span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Alex, My Ex, Gym guy"
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <Dropdown
                  label="Relationship stage"
                  value={stage}
                  onChange={setStage}
                  options={stageOptions}
                />
                <Dropdown
                  label="Your goal"
                  value={goal}
                  onChange={setGoal}
                  options={goalOptions}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[#0b0d10] hover:bg-[var(--accent-strong)]"
                >
                  Save profile
                </button>
              </div>
            </form>
          )}
        </section>

        {currentProfile && (
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
          >
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Funnel</p>
                <h2 className="text-xl font-semibold">
                  {currentProfile.nickname}
                </h2>
              </div>
              {lastScore !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-[var(--muted)]">Last score</p>
                  <p className="text-2xl font-bold text-[var(--accent)]">
                    {lastScore}
                  </p>
                </div>
              )}
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <Dropdown
                label="Who initiates more?"
                value={answers.initiator}
                onChange={(v) => setAnswers((a) => ({ ...a, initiator: v }))}
                options={initiatorOptions}
              />
              <Dropdown
                label="How consistent are their replies?"
                value={answers.consistency}
                onChange={(v) => setAnswers((a) => ({ ...a, consistency: v }))}
                options={consistencyOptions}
              />
              <Dropdown
                label="Any hot–cold behavior?"
                value={answers.hotCold}
                onChange={(v) => setAnswers((a) => ({ ...a, hotCold: v }))}
                options={hotColdOptions}
              />
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span className="font-medium text-[var(--foreground)]">
                  Has anything changed recently?
                </span>
                <input
                  value={answers.recentChange}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, recentChange: e.target.value }))
                  }
                  placeholder="Example: pulled back after last date, slower replies this week..."
                  className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-[var(--foreground)]">
                  Optional label (e.g., “After pullback”)
                </span>
                <input
                  value={answers.label}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, label: e.target.value }))
                  }
                  placeholder="After first date, After he pulled back..."
                  className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-[var(--foreground)]">
                  Short note (what changed?)
                </span>
                <input
                  value={answers.note}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, note: e.target.value }))
                  }
                  placeholder="He went silent for 3 days, then reappeared..."
                  className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                />
              </label>
            </div>

            <label className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Paste the most recent meaningful exchange
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {answers.recentExchange.trim().length} chars
                </span>
              </div>
              <textarea
                value={answers.recentExchange}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, recentExchange: e.target.value }))
                }
                placeholder="You: hey, are we still on tonight?&#10;Them: sorry got slammed, rain check?&#10;You: ... "
                className="min-h-[220px] w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--muted)]">
                We don’t store names server-side. Output is blunt, not therapy.
              </p>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[#0b0d10] transition disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b0d10]/70 border-t-transparent" />
                )}
                {loading ? "Analyzing..." : "Run analysis"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-[#0b0d10]">
          <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 lg:px-10">
            <div className="h-6 w-32 rounded-full bg-[var(--panel)] animate-pulse" />
            <div className="h-10 w-64 rounded-full bg-[var(--panel)] animate-pulse" />
            <div className="h-64 rounded-2xl bg-[var(--panel)] animate-pulse" />
          </main>
        </div>
      }
    >
      <AnalyzePageContent />
    </Suspense>
  );
}

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function Dropdown({ label, value, options, onChange }: DropdownProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function PaywallNotice({
  message,
  onClose,
  onCheckout,
}: {
  message: string;
  onClose: () => void;
  onCheckout: () => void | Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>{message}</div>
        <div className="flex gap-2">
          <button
            onClick={onCheckout}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-[#0b0d10] font-semibold"
          >
            Unlock
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-3 py-2 text-[var(--foreground)]"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
