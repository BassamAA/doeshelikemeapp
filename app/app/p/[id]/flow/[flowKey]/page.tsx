"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { flows, FlowDefinition } from "../../../../../../lib/flows";

type Props = { params: Promise<{ id: string; flowKey: string }> };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed";
}

export default function FlowRunner({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flow = useMemo<FlowDefinition | undefined>(
    () => flows.find((f) => f.key === resolvedParams.flowKey),
    [resolvedParams.flowKey],
  );

  useEffect(() => {
    if (!flow) router.back();
  }, [flow, router]);

  if (!flow) return null;
  const step = flow.steps[currentStep];

  async function handleOption(optionId: string) {
    if (!flow) return;
    const stepId = step.id;
    const nextAnswers = { ...answers, [stepId]: optionId };
    setAnswers(nextAnswers);
    const nextIndex = currentStep + 1;
    if (nextIndex < flow.steps.length) {
      setCurrentStep(nextIndex);
      return;
    }
    // complete
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/flows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: resolvedParams.id,
          flowKey: flow.key,
          answers: nextAnswers,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed");
      }
      router.push(`/app/p/${resolvedParams.id}`);
      router.refresh();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div className="text-sm text-[var(--muted)]">
          Step {currentStep + 1} / {flow.steps.length}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_10px_28px_rgba(0,0,0,0.25)]">
          <h1 className="text-2xl font-semibold">{step.title}</h1>
          {step.subtitle && <p className="text-sm text-[var(--muted)]">{step.subtitle}</p>}
          <div className="mt-4 grid gap-3">
            {step.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleOption(opt.id)}
                disabled={submitting}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-left hover:border-[var(--accent)]"
              >
                <span>{opt.label}</span>
                <span className="text-xs text-[var(--muted)]">Tap</span>
              </button>
            ))}
            {step.allowSkip && (
              <button
                onClick={() => handleOption("skip")}
                className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-left text-[var(--muted)]"
              >
                I&apos;m not sure
              </button>
            )}
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
