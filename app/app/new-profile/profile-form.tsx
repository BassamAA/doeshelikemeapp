"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const tagsPreset = ["Dating app", "Coworker", "Ex", "Situationship", "Long distance"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed";
}

export default function NewProfileForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [stage, setStage] = useState("Talking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          tags,
          context: { currentStage: stage },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed");
      }
      router.push("/app");
      router.refresh();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Display name</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Alex, My Ex, Gym Guy"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Stage</span>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2"
        >
          <option>Talking</option>
          <option>Dating</option>
          <option>Exclusive</option>
          <option>Ex</option>
          <option>Situationship</option>
        </select>
      </label>

      <div className="space-y-2 text-sm">
        <span className="font-medium">Tags</span>
        <div className="flex flex-wrap gap-2">
          {tagsPreset.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-xs ${
                tags.includes(tag)
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#0b0d10]"
                  : "border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0b0d10] disabled:opacity-60"
      >
        {loading ? "Saving..." : "Create profile"}
      </button>
    </form>
  );
}
