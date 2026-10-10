import type { ConsentScope } from "@finlit/core";
import { create } from "zustand";

/** Transient draft while the parent walks through onboarding. Not persisted. */
export interface OnboardingDraft {
  parentName: string;
  phone: string;
  familyName: string;
  city: string;
  pin: string;
  extraScopes: ConsentScope[];
  set: (patch: Partial<Omit<OnboardingDraft, "set" | "reset">>) => void;
  reset: () => void;
}

const initial = { parentName: "", phone: "", familyName: "", city: "", pin: "", extraScopes: [] as ConsentScope[] };

export const useOnboardingStore = create<OnboardingDraft>()((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));
