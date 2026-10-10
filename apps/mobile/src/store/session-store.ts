import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SessionMode = "kid" | "parent";

/** How long parent mode stays unlocked after a correct PIN. */
export const PARENT_UNLOCK_MS = 10 * 60 * 1000;

export interface SessionStore {
  mode: SessionMode | null;
  activeKidId: string | null;
  parentUnlockedUntil: number | null;
  /** Route to continue to after the PIN screen */
  pendingRoute: string | null;
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
      partialize: (s) => ({ mode: s.mode, activeKidId: s.activeKidId, parentUnlockedUntil: s.parentUnlockedUntil }),
    },
  ),
);
