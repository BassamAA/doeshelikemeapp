export type Plan = "free" | "single" | "bundle3" | "power10";

export type Entitlement = {
  plan: Plan;
  allowed_profiles: number;
  profile_scope?: string[]; // profile IDs for single unlock
};

const STORAGE_KEY = "entitlements_v1";

const PLANS: Record<Plan, Entitlement> = {
  free: { plan: "free", allowed_profiles: 1 },
  single: { plan: "single", allowed_profiles: 1 },
  bundle3: { plan: "bundle3", allowed_profiles: 3 },
  power10: { plan: "power10", allowed_profiles: 10 },
};

export function getEntitlement(): Entitlement {
  if (typeof window === "undefined") return PLANS.free;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return PLANS.free;
    const parsed = JSON.parse(raw) as Entitlement;
    return parsed;
  } catch {
    return PLANS.free;
  }
}

export function setEntitlement(ent: Entitlement) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ent));
}

export function canCreateProfile(
  currentProfiles: number,
  ent: Entitlement = getEntitlement(),
): boolean {
  return currentProfiles < ent.allowed_profiles;
}

export function canAddCheckpoint(
  profileId: string,
  checkpointCount: number,
  ent: Entitlement = getEntitlement(),
): boolean {
  if (ent.plan === "free") {
    return checkpointCount === 0; // only one total
  }
  if (ent.plan === "single" && ent.profile_scope?.length === 1) {
    return ent.profile_scope.includes(profileId);
  }
  return true;
}
