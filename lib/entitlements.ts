import { PlanType } from "@prisma/client";

export function maxProfilesForPlan(plan: PlanType | null | undefined) {
  if (plan === "POWER") return 10;
  if (plan === "BUNDLE") return 3;
  if (plan === "SINGLE") return 1;
  return 1; // FREE
}
