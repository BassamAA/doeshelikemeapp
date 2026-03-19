import { AnalysisResult } from "./analysis";

export type FunnelAnswers = {
  initiator: string;
  consistency: string;
  hotCold: string;
  recentExchange: string;
  recentChange: string;
  label?: string;
  note?: string;
};

export type Checkpoint = {
  id: string;
  timestamp: number;
  answers: FunnelAnswers;
  analysis?: AnalysisResult;
  deltas?: TrendDeltas;
  pattern_label?: string;
  next_move?: "ask" | "pull_back" | "wait";
  horizon_days?: number;
  horizon_expectation?: string;
};

export type TrendDeltas = {
  interest_delta: number | null;
  trend_arrow: "up" | "down" | "flat";
  risk_flags_delta: number | null;
  consistency_delta?: "improving" | "slipping" | "steady";
};

export type RomanticProfile = {
  id: string;
  nickname: string;
  relationship_stage: string;
  user_goal: string;
  initiator?: string;
  reply_time?: string;
  hot_cold_pattern?: string;
  context_summary?: string;
  created_at: number;
  current_interest_score?: number;
  last_updated_at?: number;
  risk_level?: "low" | "medium" | "high";
  clarity_window_days?: number;
  checkpoints: Checkpoint[];
};

const STORAGE_KEY = "romantic_profiles_v1";

function loadRaw(): RomanticProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn("Failed to load profiles", error);
    return [];
  }
}

function persist(profiles: RomanticProfile[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getProfiles(): RomanticProfile[] {
  return loadRaw();
}

export function getProfileById(id: string): RomanticProfile | undefined {
  return loadRaw().find((p) => p.id === id);
}

export function createProfile(input: {
  nickname: string;
  relationship_stage: string;
  user_goal: string;
}): RomanticProfile {
  const profiles = loadRaw();
  const now = Date.now();
  const profile: RomanticProfile = {
    id: crypto.randomUUID(),
    nickname: input.nickname.trim(),
    relationship_stage: input.relationship_stage,
    user_goal: input.user_goal,
    created_at: now,
    checkpoints: [],
  };
  profiles.unshift(profile);
  persist(profiles);
  return profile;
}

export function addCheckpoint(profileId: string, entry: Checkpoint) {
  const profiles = loadRaw();
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx === -1) return;
  const profile = profiles[idx];
  const last = profile.checkpoints?.[0];
  const deltas = computeDeltas(entry.analysis, last?.analysis);
  entry.deltas = deltas;
  if (!profile.checkpoints) profile.checkpoints = [];
  profile.checkpoints.unshift(entry);

  if (entry.analysis) {
    profile.current_interest_score = entry.analysis.interest_score;
    profile.last_updated_at = entry.timestamp;
    profile.risk_level = computeRisk(entry.analysis);
  }

  profiles[idx] = profile;
  persist(profiles);
}

export function upsertProfile(updated: RomanticProfile) {
  const profiles = loadRaw();
  const idx = profiles.findIndex((p) => p.id === updated.id);
  if (idx === -1) profiles.unshift(updated);
  else profiles[idx] = updated;
  persist(profiles);
}

export function computeDeltas(
  current?: AnalysisResult,
  previous?: AnalysisResult,
): TrendDeltas | undefined {
  if (!current) return undefined;
  const interest_delta =
    previous && typeof previous.interest_score === "number"
      ? Math.round(current.interest_score - previous.interest_score)
      : null;
  const trend_arrow =
    interest_delta === null
      ? "flat"
      : interest_delta >= 3
        ? "up"
        : interest_delta <= -3
          ? "down"
          : "flat";

  const risk_flags_delta =
    previous && previous.signals
      ? current.signals.red_flags.length - previous.signals.red_flags.length
      : null;

  const consistency_delta: TrendDeltas["consistency_delta"] | undefined =
    undefined;

  return { interest_delta, trend_arrow, risk_flags_delta, consistency_delta };
}

export function computeRisk(analysis: AnalysisResult | undefined) {
  if (!analysis) return undefined;
  const score = analysis.interest_score;
  const reds = analysis.signals.red_flags.length;
  if (score < 40 || reds >= 3) return "high";
  if (score < 65 || reds === 2) return "medium";
  return "low";
}
