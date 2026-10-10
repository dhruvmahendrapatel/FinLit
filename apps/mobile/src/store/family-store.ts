import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyState, createDemoState, type FamilyState } from "@finlit/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WithState = { state: FamilyState };

export interface FamilyStore {
  state: FamilyState;
  hydrated: boolean;
  setHydrated: () => void;
  replace: (state: FamilyState) => void;
  loadDemo: () => void;
  reset: () => void;
  /**
   * Run a pure core command against the current state and store the result.
   * Commands either return a new FamilyState or `{ state, ...extras }`.
   */
  dispatch: {
    (fn: (state: FamilyState, now: string) => FamilyState): void;
    <R extends WithState>(fn: (state: FamilyState, now: string) => R): R;
  };
}

function isFamilyState(value: unknown): value is FamilyState {
  return typeof value === "object" && value !== null && "version" in value && "ledger" in value;
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      state: emptyState(),
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      replace: (state) => set({ state }),
      loadDemo: () => set({ state: createDemoState(new Date()) }),
      reset: () => set({ state: emptyState() }),
      dispatch: ((fn: (state: FamilyState, now: string) => FamilyState | WithState) => {
        const result = fn(get().state, new Date().toISOString());
        if (isFamilyState(result)) {
          set({ state: result });
          return undefined;
        }
        set({ state: result.state });
        return result;
      }) as FamilyStore["dispatch"],
    }),
    {
      name: "chillar.family.v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (store) => ({ state: store.state }),
      onRehydrateStorage: () => (store) => {
        store?.setHydrated();
      },
    },
  ),
);

/** Convenience selector hooks */
export const useFamilyState = (): FamilyState => useFamilyStore((s) => s.state);
export const useDispatch = (): FamilyStore["dispatch"] => useFamilyStore((s) => s.dispatch);
