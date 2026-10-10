import {
  choresForKid,
  entitlementsFor,
  familyOverview,
  kidSummary,
  lessonPath,
  nextLessonFor,
  pendingApprovals,
  type Entitlements,
  type Kid,
} from "@finlit/core";
import { useMemo } from "react";

import { useToday } from "./use-today";
import { useFamilyState } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";

export function useEntitlements(): Entitlements {
  const planId = useFamilyState().planId;
  return useMemo(() => entitlementsFor(planId), [planId]);
}

/** The kid using kid mode. Falls back to the first kid so deep links still render. */
export function useActiveKid(): Kid | null {
  const kids = useFamilyState().kids;
  const activeKidId = useSessionStore((s) => s.activeKidId);
  return useMemo(() => kids.find((k) => k.id === activeKidId) ?? kids[0] ?? null, [kids, activeKidId]);
}

export function useKidSummary(kidId: string | null | undefined) {
  const state = useFamilyState();
  const today = useToday();
  return useMemo(() => (kidId && state.kids.some((k) => k.id === kidId) ? kidSummary(state, kidId, today) : null), [state, kidId, today]);
}

export function useFamilyOverview() {
  const state = useFamilyState();
  const today = useToday();
  return useMemo(() => familyOverview(state, today), [state, today]);
}

export function usePendingApprovals() {
  const state = useFamilyState();
  return useMemo(() => pendingApprovals(state), [state]);
}

export function useChoresForKid(kidId: string | null | undefined) {
  const state = useFamilyState();
  return useMemo(() => (kidId ? choresForKid(state, kidId) : null), [state, kidId]);
}

export function useLessonPath(kidId: string | null | undefined) {
  const state = useFamilyState();
  return useMemo(() => (kidId ? lessonPath(state, kidId) : []), [state, kidId]);
}

export function useNextLesson(kidId: string | null | undefined) {
  const state = useFamilyState();
  return useMemo(() => (kidId ? nextLessonFor(state, kidId) : null), [state, kidId]);
}
