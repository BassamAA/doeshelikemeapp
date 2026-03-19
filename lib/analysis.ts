export type AnalysisResult = {
  interest_score: number;
  intent_label:
    | "invested"
    | "casual"
    | "breadcrumbing"
    | "avoidant"
    | "using_attention"
    | "unclear";
  power_dynamic: "user_chasing" | "balanced" | "other_chasing";
  signals: {
    green_flags: string[];
    red_flags: string[];
  };
  what_it_means: string[];
  what_to_do_next: string[];
  suggested_reply: {
    tone: "calm" | "playful" | "direct" | "pull_back";
    text: string;
  };
};

export function encodeAnalysis(result: AnalysisResult) {
  return encodeURIComponent(JSON.stringify(result));
}

export function decodeAnalysis(payload: string): AnalysisResult | null {
  try {
    return JSON.parse(decodeURIComponent(payload)) as AnalysisResult;
  } catch (error) {
    console.error("Failed to decode analysis payload", error);
    return null;
  }
}

export type EncodedResult = {
  analysis: AnalysisResult;
  profileId?: string;
  interactionId?: string;
  previous_score?: number;
  previous_red_flags?: number;
};

export function encodeResult(data: EncodedResult) {
  return encodeURIComponent(JSON.stringify(data));
}

export function decodeResult(payload: string): EncodedResult | null {
  try {
    return JSON.parse(decodeURIComponent(payload)) as EncodedResult;
  } catch (error) {
    console.error("Failed to decode analysis payload", error);
    return null;
  }
}
