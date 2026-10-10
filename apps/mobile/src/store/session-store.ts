import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SessionMode = "kid" | "parent";

/** How long parent mode stays unlocked after a correct PIN. */
export const PARENT_UNLOCK_MS = 10 * 60 * 1000;

export interface KidUsage {
  /** ISO date the counter belongs to */
  date: string;
  seconds: number;
}

export interface SessionStore {
  mode: SessionMode | null;
  activeKidId: string | null;
  parentUnlockedUntil: number | null;
  /** Route to continue to after the PIN screen */
  pendingRoute: string | null;
  /** Kid-mode screen time today (daily limit lives in family settings) */
  usage: KidUsage;
  /** Parent-granted extension past the daily limit */
  extensionUntil: number | null;
  tick: (seconds: number, today: string) => void;
  grantExtension: (minutes: number) => void;
  enterKid: (kidId: string) => void;
  unlockParent: () => void;
  enterParent: () => void;
  lockParent: () => void;
  setPendingRoute: (route: string | null) => void;
  isParentUnlocked: () => boolean;
  clear: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      mode: null,
      activeKidId: null,
      parentUnlockedUntil: null,
      pendingRoute: null,
      usage: { date: "", seconds: 0 },
      extensionUntil: null,
      tick: (seconds, today) =>
        set((s) => ({ usage: s.usage.date === today ? { date: today, seconds: s.usage.seconds + seconds } : { date: today, seconds } })),
      grantExtension: (minutes) => set({ extensionUntil: Date.now() + minutes * 60 * 1000 }),
      enterKid: (kidId) => set({ mode: "kid", activeKidId: kidId }),
      unlockParent: () => set({ parentUnlockedUntil: Date.now() + PARENT_UNLOCK_MS }),
      enterParent: () => set({ mode: "parent" }),
      lockParent: () => set({ parentUnlockedUntil: null, mode: null }),
      setPendingRoute: (route) => set({ pendingRoute: route }),
      isParentUnlocked: () => {
        const until = get().parentUnlockedUntil;
        return until !== null && until > Date.now();
      },
      clear: () => set({ mode: null, activeKidId: null, parentUnlockedUntil: null, pendingRoute: null }),
    }),
    {
      name: "chillar.session.v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        mode: s.mode,
        activeKidId: s.activeKidId,
        parentUnlockedUntil: s.parentUnlockedUntil,
        usage: s.usage,
        extensionUntil: s.extensionUntil,
      }),
    },
  ),
);
