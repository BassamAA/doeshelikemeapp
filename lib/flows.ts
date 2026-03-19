import { ProfileEventType } from "@prisma/client";

export type FlowKey = "status" | "texting" | "date" | "conflict" | "comeback";

type FlowPayloadValue =
  | string
  | number
  | boolean
  | null
  | FlowPayloadValue[]
  | { [key: string]: FlowPayloadValue };

export type FlowAnswers = Record<string, string>;

export type FlowOption = {
  id: string;
  label: string;
  next?: string;
  payload?: Record<string, FlowPayloadValue>;
};

export type FlowStep = {
  id: string;
  title: string;
  subtitle?: string;
  options: FlowOption[];
  allowSkip?: boolean;
};

export type FlowDefinition = {
  key: FlowKey;
  name: string;
  steps: FlowStep[];
  result: (answers: FlowAnswers) => FlowResult;
};

export type FlowResult = {
  situation: string;
  confidence: "low" | "medium" | "high";
  doNext: string[];
  avoid: string[];
  scripts: { label: string; text: string }[];
  eventType: ProfileEventType;
  payload: Record<string, FlowPayloadValue>;
};

function makeResult(
  situation: string,
  confidence: FlowResult["confidence"],
  answers: FlowAnswers,
): FlowResult {
  return {
    situation,
    confidence,
    doNext: ["Ask for clarity", "Match energy, not effort", "Set a 7-day check-in"],
    avoid: ["Over-explaining", "Chasing after a pullback", "Future-faking"],
    scripts: [
      { label: "Calm ask", text: "Want to be on the same page—what are you looking for right now?" },
      { label: "Pull back", text: "Going to match your pace. If you want to make plans, let me know." },
      { label: "Playful nudge", text: "Your move. I owe you a coffee if you pick a time." },
    ],
    eventType: ProfileEventType.SYSTEM_RESULT,
    payload: { answers },
  };
}

export const flows: FlowDefinition[] = [
  {
    key: "status",
    name: "Where are we at?",
    steps: [
      {
        id: "vibe",
        title: "How are their replies?",
        options: [
          { id: "fast", label: "Fast & engaged" },
          { id: "ok", label: "Timely but short" },
          { id: "slow", label: "Slow or spotty" },
          { id: "cold", label: "Cold / dry" },
        ],
      },
      {
        id: "plans",
        title: "Plans and initiative?",
        options: [
          { id: "plans_made", label: "They propose plans" },
          { id: "equal", label: "We both propose" },
          { id: "me_only", label: "I chase plans" },
          { id: "no_plans", label: "No concrete plans" },
        ],
      },
    ],
    result: (answers) => makeResult("Interest with mixed momentum", "medium", answers),
  },
  {
    key: "texting",
    name: "Texting / messaging",
    steps: [
      {
        id: "reply",
        title: "What just happened?",
        options: [
          { id: "no_reply", label: "No reply" },
          { id: "dry", label: "Dry reply" },
          { id: "double_text", label: "I double-texted" },
          { id: "good", label: "Good reply" },
        ],
      },
      {
        id: "tone",
        title: "Tone you want",
        options: [
          { id: "calm", label: "Calm" },
          { id: "assertive", label: "Assertive" },
          { id: "playful", label: "Playful" },
        ],
      },
    ],
    result: (answers) => makeResult("Texting adjustment", "medium", answers),
  },
  {
    key: "date",
    name: "Date planning",
    steps: [
      {
        id: "state",
        title: "Date status",
        options: [
          { id: "set", label: "Date set" },
          { id: "confirm", label: "Need confirmation" },
          { id: "flake", label: "They flaked" },
          { id: "resched", label: "Reschedule needed" },
        ],
      },
      {
        id: "urgency",
        title: "How soon?",
        options: [
          { id: "48h", label: "Within 48h" },
          { id: "week", label: "Within a week" },
          { id: "later", label: "Later / flexible" },
        ],
      },
    ],
    result: (answers) => makeResult("Date logistics", "high", answers),
  },
  {
    key: "conflict",
    name: "Conflict / distance",
    steps: [
      {
        id: "conflict",
        title: "What's up?",
        options: [
          { id: "argument", label: "Argument happened" },
          { id: "cold", label: "They're cold/distant" },
          { id: "jealousy", label: "Jealousy flare" },
          { id: "break", label: "Talk of break" },
        ],
      },
      {
        id: "responsibility",
        title: "Ownership",
        options: [
          { id: "me", label: "I need to own" },
          { id: "them", label: "They need to own" },
          { id: "both", label: "Shared" },
        ],
      },
    ],
    result: (answers) => makeResult("Tension detected", "medium", answers),
  },
  {
    key: "comeback",
    name: "Re-attraction / comeback",
    steps: [
      {
        id: "gap",
        title: "Time apart",
        options: [
          { id: "days", label: "Days" },
          { id: "weeks", label: "Weeks" },
          { id: "months", label: "Months" },
        ],
      },
      {
        id: "last_contact",
        title: "Last contact",
        options: [
          { id: "me", label: "I reached out" },
          { id: "them", label: "They reached out" },
          { id: "none", label: "No contact" },
        ],
      },
    ],
    result: (answers) => makeResult("Re-attraction attempt", "low", answers),
  },
];
