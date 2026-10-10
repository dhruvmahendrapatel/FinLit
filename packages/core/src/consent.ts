import type { ISODateTime } from "./time";

/** Bump when the privacy notice changes materially; families must re-consent. */
export const CONSENT_VERSION = "2026-10";

export type ConsentMethod = "digilocker" | "otp_demo";

export type ConsentScope =
  | "child_profile"
  | "ledger"
  | "learning_progress"
  | "school_link"
  | "parent_ads";

export const CONSENT_SCOPE_INFO: Record<ConsentScope, { title: string; description: string; required: boolean }> = {
  child_profile: {
    title: "Child profile",
    description: "Name, age band and avatar so the app can adapt lessons.",
    required: true,
  },
  ledger: {
    title: "Pocket-money ledger",
    description: "Allowance, chores and jar balances you record in the app.",
    required: true,
  },
  learning_progress: {
    title: "Learning progress",
    description: "Lessons completed, quiz scores and streaks.",
    required: true,
  },
  school_link: {
    title: "School link (coming soon)",
    description: "Attendance and report-card data from your school's app, only if you link it.",
    required: false,
  },
  parent_ads: {
    title: "Personalised ads on parent screens",
    description: "Kids never see personalised ads. This only affects your own screens.",
    required: false,
  },
};

export interface ParentConsent {
  parentId: string;
  version: string;
  method: ConsentMethod;
  scopes: ConsentScope[];
  grantedAt: ISODateTime;
}

export function grantConsent(
  parentId: string,
  method: ConsentMethod,
  scopes: ConsentScope[],
  now: ISODateTime,
): ParentConsent {
  const required = (Object.keys(CONSENT_SCOPE_INFO) as ConsentScope[]).filter((s) => CONSENT_SCOPE_INFO[s].required);
  const merged = Array.from(new Set<ConsentScope>([...required, ...scopes]));
  return { parentId, version: CONSENT_VERSION, method, scopes: merged, grantedAt: now };
}

export function isConsentCurrent(consent: ParentConsent | null | undefined): boolean {
  return !!consent && consent.version === CONSENT_VERSION;
}

export function hasScope(consent: ParentConsent | null | undefined, scope: ConsentScope): boolean {
  return !!consent && consent.scopes.includes(scope);
}
