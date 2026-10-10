import type { FamilyState } from "./state";
import type { ISODateTime } from "./time";

/** Portable copy of a family's data (DPDP right to access / portability). */
export interface FamilyExport {
  app: "chillar";
  format: 1;
  exportedAt: ISODateTime;
  family: FamilyState;
}

export function buildExport(state: FamilyState, now: ISODateTime): FamilyExport {
  const family: FamilyState = state.parent
    ? { ...state, parent: { ...state.parent, pin: "****" } }
    : state;
  return { app: "chillar", format: 1, exportedAt: now, family };
}

/** Pretty JSON with the parent PIN redacted. */
export function serializeExport(state: FamilyState, now: ISODateTime): string {
  return JSON.stringify(buildExport(state, now), null, 2);
}
