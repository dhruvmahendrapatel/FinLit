import { canUse, type PlanId } from "./entitlements";
import type { AgeBand } from "./types";

export type Audience = "parent" | "kid";
export type AdMode = "none" | "contextual" | "consented_personalized";

export interface AdPolicy {
  show: boolean;
  mode: AdMode;
  /** Why — surfaced in debug/settings so the DPDP stance is explicit */
  reason: string;
}

export interface AdPolicyInput {
  audience: Audience;
  planId: PlanId;
  /** Parent opted in to personalised ads on parent screens */
  parentAdConsent: boolean;
  kidAgeBand?: AgeBand;
  /** Inside a lesson or quiz */
  inLesson?: boolean;
}

/**
 * Encodes the research's DPDP guardrails:
 *  - kids never get personalised ads or ad identifiers; contextual only
 *  - no ads inside lessons for under-9s
 *  - premium removes ads everywhere
 */
export function adPolicy(input: AdPolicyInput): AdPolicy {
  if (canUse(input.planId, "ad_free")) {
    return { show: false, mode: "none", reason: "Family Premium is ad-free" };
  }
  if (input.audience === "kid") {
    if (input.inLesson && input.kidAgeBand === "explorer") {
      return { show: false, mode: "none", reason: "No ads inside lessons for under-9s" };
    }
    return { show: true, mode: "contextual", reason: "Kids see contextual ads only, with no ad identifiers (DPDP s.9)" };
  }
  return input.parentAdConsent
    ? { show: true, mode: "consented_personalized", reason: "Parent consented to personalised ads" }
    : { show: true, mode: "contextual", reason: "Parent has not opted in to personalised ads" };
}
