import { create } from "zustand";

export type SyncStatus = "disabled" | "signed_out" | "unlinked" | "ready" | "syncing" | "error";

export interface SyncStore {
  status: SyncStatus;
  familyId: string | null;
  role: "parent" | "kid" | null;
  kidId: string | null;
  revision: number;
  lastSyncedAt: string | null;
  error: string | null;
  set: (patch: Partial<Omit<SyncStore, "set">>) => void;
}

/** Runtime sync status (not persisted; Supabase keeps the auth session). */
export const useSyncStore = create<SyncStore>()((set) => ({
  status: "disabled",
  familyId: null,
  role: null,
  kidId: null,
  revision: 0,
  lastSyncedAt: null,
  error: null,
  set: (patch) => set(patch),
}));
