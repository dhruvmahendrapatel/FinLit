/**
 * Family sync over Supabase. The whole FamilyState is one JSON document with a revision
 * number; devices push with optimistic concurrency and replay their pending commands on
 * conflict (commands are pure, so replay is safe). Realtime pushes remote changes down.
 *
 * Everything here is a no-op unless the build has EXPO_PUBLIC_SUPABASE_* set.
 */
import type { FamilyState } from "@finlit/core";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { cloudEnabled, supabase } from "./supabase";
import { useFamilyStore } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";
import { useSyncStore } from "@/store/sync-store";
import { toast } from "@/store/toast-store";

type PendingCommand = (state: FamilyState, now: string) => FamilyState;

let channel: RealtimeChannel | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
const pending: PendingCommand[] = [];

function fail(message: string): never {
  throw new Error(message);
}

// ───────── auth ─────────

export async function signInWithPhone(phone: string): Promise<void> {
  if (!supabase) fail("Cloud sync is not configured in this build");
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) fail(error.message);
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<void> {
  if (!supabase) fail("Cloud sync is not configured in this build");
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) fail(error.message);
  await refreshMembership();
}

/** Kid devices get an anonymous account, then join a family with a pairing code. */
export async function signInAsKid(): Promise<void> {
  if (!supabase) fail("Cloud sync is not configured in this build");
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) fail(error.message);
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  stopRealtime();
  useSyncStore.getState().set({ status: "signed_out", familyId: null, role: null, kidId: null, revision: 0 });
}

// ───────── membership & family ─────────

interface Membership {
  family_id: string;
  role: "parent" | "kid";
  kid_id: string | null;
  revision: number;
}

export async function refreshMembership(): Promise<Membership | null> {
  const sync = useSyncStore.getState();
  if (!supabase) {
    sync.set({ status: "disabled" });
    return null;
  }
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    sync.set({ status: "signed_out", familyId: null, role: null, kidId: null });
    return null;
  }
  const { data, error } = await supabase.rpc("my_membership");
  if (error) {
    sync.set({ status: "error", error: error.message });
    return null;
  }
  const row = (data as Membership[] | null)?.[0] ?? null;
  if (!row) {
    sync.set({ status: "unlinked", familyId: null, role: null, kidId: null });
    return null;
  }
  sync.set({ status: "ready", familyId: row.family_id, role: row.role, kidId: row.kid_id, revision: Number(row.revision), error: null });
  return row;
}

/** Parent: upload the local family to the cloud for the first time. */
export async function linkFamilyToCloud(): Promise<string> {
  if (!supabase) fail("Cloud sync is not configured in this build");
  const state = useFamilyStore.getState().state;
  if (!state.family) fail("Set up the family first");
  const { data, error } = await supabase.rpc("create_family", { p_name: state.family.name, p_city: state.family.city, p_state: state });
  if (error) fail(error.message);
  const familyId = data as string;
  useSyncStore.getState().set({ status: "ready", familyId, role: "parent", kidId: null, revision: 1, lastSyncedAt: new Date().toISOString(), error: null });
  startRealtime(familyId);
  return familyId;
}

export async function createPairingCode(kidId: string): Promise<string> {
  if (!supabase) fail("Cloud sync is not configured in this build");
  const familyId = useSyncStore.getState().familyId;
  if (!familyId) fail("Link the family to the cloud first");
  const { data, error } = await supabase.rpc("create_pairing_code", { p_family: familyId, p_kid_id: kidId });
  if (error) fail(error.message);
  return data as string;
}

/** Kid device: redeem a code, pull the family and enter kid mode. */
export async function joinWithPairingCode(code: string): Promise<{ familyId: string; kidId: string }> {
  if (!supabase) fail("Cloud sync is not configured in this build");
  await signInAsKid();
  const { data, error } = await supabase.rpc("redeem_pairing_code", { p_code: code.trim() });
  if (error) fail(error.message.includes("invalid") ? "That code is invalid or has expired" : error.message);
  const row = (data as { family_id: string; kid_id: string }[] | null)?.[0];
  if (!row) fail("That code is invalid or has expired");
  await refreshMembership();
  await pullState();
  useSessionStore.getState().enterKid(row.kid_id);
  return { familyId: row.family_id, kidId: row.kid_id };
}

// ───────── state transfer ─────────

export async function pullState(): Promise<boolean> {
  if (!supabase) return false;
  const sync = useSyncStore.getState();
  if (!sync.familyId) return false;
  const { data, error } = await supabase.from("family_state").select("state, revision, updated_at").eq("family_id", sync.familyId).single();
  if (error) {
    sync.set({ status: "error", error: error.message });
    return false;
  }
  const remote = data as { state: FamilyState; revision: number; updated_at: string };
  useFamilyStore.getState().replace(remote.state);
  sync.set({ status: "ready", revision: Number(remote.revision), lastSyncedAt: remote.updated_at, error: null });
  return true;
}

async function pushNow(): Promise<void> {
  if (!supabase) return;
  const sync = useSyncStore.getState();
  if (!sync.familyId || sync.status === "disabled" || sync.status === "signed_out" || sync.status === "unlinked") return;
  const state = useFamilyStore.getState().state;
  sync.set({ status: "syncing" });
  const { data, error } = await supabase.rpc("save_family_state", { p_family: sync.familyId, p_state: state, p_expected: sync.revision });
  if (!error) {
    pending.length = 0;
    sync.set({ status: "ready", revision: Number(data), lastSyncedAt: new Date().toISOString(), error: null });
    return;
  }
  if (error.code === "40001" || error.message.includes("conflict")) {
    // Someone else wrote first: take their state, replay what this device did, try again.
    const replay = [...pending];
    pending.length = 0;
    await pullState();
    if (replay.length > 0) {
      const store = useFamilyStore.getState();
      let next = store.state;
      const now = new Date().toISOString();
      for (const cmd of replay) {
        try {
          next = cmd(next, now);
        } catch {
          // The replayed action no longer applies (e.g. chore already approved elsewhere).
        }
      }
      store.replace(next);
      schedulePush(replay);
    }
    return;
  }
  sync.set({ status: "error", error: error.message });
}

/** Called by the family store after every dispatch. Debounced so bursts become one write. */
export function schedulePush(commands: PendingCommand[] = []): void {
  if (!cloudEnabled) return;
  pending.push(...commands);
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushNow().catch((err: unknown) => useSyncStore.getState().set({ status: "error", error: err instanceof Error ? err.message : String(err) }));
  }, 800);
}

// ───────── realtime ─────────

export function startRealtime(familyId: string): void {
  if (!supabase) return;
  stopRealtime();
  channel = supabase
    .channel(`family_state:${familyId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "family_state", filter: `family_id=eq.${familyId}` }, (payload) => {
      const row = payload.new as { state: FamilyState; revision: number; updated_at: string };
      const sync = useSyncStore.getState();
      if (Number(row.revision) <= sync.revision) return;
      useFamilyStore.getState().replace(row.state);
      sync.set({ revision: Number(row.revision), lastSyncedAt: row.updated_at });
    })
    .subscribe();
}

export function stopRealtime(): void {
  if (channel && supabase) {
    void supabase.removeChannel(channel);
    channel = null;
  }
}

/** Boot: restore membership, pull the latest state and listen for changes. */
export async function initSync(): Promise<void> {
  if (!cloudEnabled) return;
  const membership = await refreshMembership();
  if (!membership) return;
  const pulled = await pullState();
  if (pulled) startRealtime(membership.family_id);
  else toast({ title: "Couldn’t reach the cloud", body: "Working offline; changes sync when you’re back", emoji: "☁️" });
}
