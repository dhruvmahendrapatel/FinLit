import { create } from "zustand";

export interface ToastMessage {
  id: number;
  title: string;
  body?: string;
  emoji?: string;
  tone?: "default" | "success" | "premium" | "danger";
}

interface ToastStore {
  queue: ToastMessage[];
  show: (toast: Omit<ToastMessage, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastStore>()((set) => ({
  queue: [],
  show: (toast) => set((s) => ({ queue: [...s.queue, { ...toast, id: nextId++ }].slice(-3) })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));

export const toast = (t: Omit<ToastMessage, "id">): void => useToastStore.getState().show(t);
