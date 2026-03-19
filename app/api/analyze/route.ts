import { NextResponse } from "next/server";
import { AnalysisResult } from "../../../lib/analysis";

const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const TEMPERATURE = 0.25;

type RequestBody = {
  chat?: string;
  stage?: string;
  initiator?: string;
  goal?: string;
  profile?: {
    id: string;
    nickname: string;
    relationship_stage: string;
    user_goal: string;
  };
  context?: {
    consistency?: string;
    hotCold?: string;
    recentChange?: string;
    last_interest_score?: number | null;
    label?: string;
    note?: string;
  };
  history?: Array<{
    score?: number;
    intent?: string;
    power?: string;
    timestamp?: number;
  }>;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as RequestBody;
  const { chat, stage, initiator, goal, profile, context, history } = body;

  if (!chat || typeof chat !== "string" || chat.trim().length < 10) {
    return NextResponse.json(
      { error: "Chat text is required and must be longer." },
      { status: 400 },
    );
  }

  try {
    const analysis = await generateAnalysis({
      apiKey,
      chat,
      stage: stage || profile?.relationship_stage || "Talking",
      initiator: initiator || "About equal",
      goal: goal || profile?.user_goal || "Clarity",
      profile,
      context,
      history,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis failed", error);
    return NextResponse.json(
      safeFallback("We could not analyze this chat. Please try again."),
      { status: 200 },
    );
  }
}

async function generateAnalysis({
  apiKey,
  chat,
  stage,
  initiator,
  goal,
  profile,
  context,
  history,
  attempt = 0,
}: {
  apiKey: string;
  chat: string;
  stage: string;
  initiator: string;
  goal: string;
  profile?: RequestBody["profile"];
  context?: RequestBody["context"];
  history?: RequestBody["history"];
  attempt?: number;
}): Promise<AnalysisResult> {
  const lastScore =
    context?.last_interest_score !== undefined
      ? context.last_interest_score
      : null;

  const historyLines =
    history && history.length
      ? history
          .slice(0, 3)
          .map(
            (h, idx) =>
              `Past #${idx + 1}: score ${h.score ?? "?"}, intent ${
                h.intent ?? "?"
              }, power ${h.power ?? "?"}, time ${h.timestamp ?? ""}`,
          )
          .join("\n")
      : "No past analyses yet.";

  const messages = [
    {
      role: "system",
      content:
        "You are an expert reader of romantic chat patterns for women aged 18-35. Be blunt but calm. No therapy language. No predictions. You track a single romantic person over time. Focus on change over time when context exists. Output ONLY strict JSON that matches the provided schema. Temperature must stay low. Do not include Markdown or prose outside JSON.",
    },
    {
      role: "user",
      content: [
        "Analyze this evolving romantic profile and return JSON in this schema:",
        JSON.stringify(schemaShape, null, 2),
        "",
        "Rules:",
        "- interest_score is 0-100 (whole number).",
        "- intent_label one of: invested | casual | breadcrumbing | avoidant | using_attention | unclear",
        "- power_dynamic one of: user_chasing | balanced | other_chasing",
        "- Each array should have 2-4 short bullets, phrased plainly.",
        "- suggested_reply.tone one of: calm | playful | direct | pull_back",
        "- Do not include any keys outside the schema.",
        "- Call out signal shifts and score changes if prior context exists.",
        "- Provide: most_likely_pattern (breadcrumbing/genuine/attention/slow_burn/etc), next_move (ask / pull_back / wait), horizon_days, horizon_expectation.",
        "- suggested_reply should align with the recommended next_move (tone calm/playful/direct/pull_back).",
        "",
        profile
          ? `Profile: ${profile.nickname} | stage: ${profile.relationship_stage} | goal: ${profile.user_goal}`
          : "Profile: (none provided)",
        `Who initiates more (current): ${initiator}`,
        `Reply consistency (current): ${context?.consistency ?? "n/a"}`,
        `Hot–cold behavior (current): ${context?.hotCold ?? "n/a"}`,
        `Recent change noted: ${context?.recentChange || "none"}`,
        `Checkpoint label: ${context?.label || "none"}`,
        `User note: ${context?.note || "none"}`,
        lastScore !== null
          ? `Previous interest score: ${lastScore}`
          : "Previous interest score: none",
        "Recent history:",
        historyLines,
        "",
        "Latest chat transcript:",
        chat,
      ].join("\n"),
    },
  ];

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!completion.ok) {
    if (completion.status === 429) {
      if (attempt === 0) {
        await delay(800);
        return generateAnalysis({
          apiKey,
          chat,
          stage,
          initiator,
          goal,
          profile,
          context,
          history,
          attempt: 1,
        });
      }
      return safeFallback(
        "We're hitting the model limit right now. Wait a moment and retry.",
      );
    }
    throw new Error(`OpenAI error: ${completion.statusText}`);
  }

  const data = await completion.json();
  const content: string =
    data?.choices?.[0]?.message?.content?.trim() || "{}";

  const parsed = parseIfValid(content);
  if (parsed) return parsed;

  if (attempt === 0) {
    return generateAnalysis({
      apiKey,
      chat,
      stage,
      initiator,
      goal,
      profile,
      context,
      history,
      attempt: 1,
    });
  }

  return safeFallback("We could not get clean JSON back.");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseIfValid(payload: string): AnalysisResult | null {
  try {
    const parsed = JSON.parse(payload);
    if (isValidAnalysis(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse analysis JSON", error);
  }
  return null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isValidAnalysis(candidate: unknown): candidate is AnalysisResult {
  if (!candidate || typeof candidate !== "object") return false;
  const obj = candidate as AnalysisResult;
  const intentOptions = new Set([
    "invested",
    "casual",
    "breadcrumbing",
    "avoidant",
    "using_attention",
    "unclear",
  ]);
  const powerOptions = new Set(["user_chasing", "balanced", "other_chasing"]);
  const toneOptions = new Set(["calm", "playful", "direct", "pull_back"]);

  return (
    typeof obj.interest_score === "number" &&
    obj.interest_score >= 0 &&
    obj.interest_score <= 100 &&
    intentOptions.has(obj.intent_label) &&
    powerOptions.has(obj.power_dynamic) &&
    obj.signals &&
    isStringArray(obj.signals.green_flags) &&
    isStringArray(obj.signals.red_flags) &&
    isStringArray(obj.what_it_means) &&
    isStringArray(obj.what_to_do_next) &&
    obj.suggested_reply &&
    toneOptions.has(obj.suggested_reply.tone) &&
    typeof obj.suggested_reply.text === "string"
  );
}

function safeFallback(message: string): AnalysisResult {
  return {
    interest_score: 0,
    intent_label: "unclear",
    power_dynamic: "balanced",
    signals: { green_flags: [], red_flags: [] },
    what_it_means: [message],
    what_to_do_next: [
      "Simplify the chat to the latest 15-30 messages.",
      "Remove names and emojis, then retry.",
      "If it still fails, try again in a few minutes.",
    ],
    suggested_reply: {
      tone: "calm",
      text: "Hey, I want to be clear on where we stand. What are you looking for here?",
    },
  };
}

const schemaShape: AnalysisResult = {
  interest_score: 0,
  intent_label: "unclear",
  power_dynamic: "balanced",
  signals: { green_flags: ["example"], red_flags: ["example"] },
  what_it_means: ["example"],
  what_to_do_next: ["example"],
  suggested_reply: { tone: "calm", text: "example" },
};
