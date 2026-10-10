import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { useToday } from "./use-today";
import { useFamilyState } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";
import { toast } from "@/store/toast-store";

const TICK_SECONDS = 15;
const WARN_AT_SECONDS = 120;

export interface KidTimer {
  usedSeconds: number;
  remainingSeconds: number;
  limitMinutes: number;
  /** True once the daily limit is spent and no parent extension is active */
  blocked: boolean;
}

/**
 * Counts kid-mode screen time while the app is in the foreground and reports whether the
 * family's daily limit (Settings › Kid mode) has been reached. Research guardrail: Chillar is
 * built for 5–10 minutes a day, so the limit is enforced, not just displayed.
 */
export function useKidTimer(active: boolean): KidTimer {
  const limitMinutes = useFamilyState().settings.dailyKidMinutes;
  const today = useToday();
  const usage = useSessionStore((s) => s.usage);
  const extensionUntil = useSessionStore((s) => s.extensionUntil);
  const tick = useSessionStore((s) => s.tick);
  const warnedFor = useRef<string | null>(null);
  // Whether a parent extension is currently valid; refreshed on each tick (render stays pure).
  const [extended, setExtended] = useState(false);

  useEffect(() => {
    const check = () => setExtended(extensionUntil !== null && extensionUntil > Date.now());
    check();
    if (!active) return undefined;
    const id = setInterval(() => {
      check();
      if (AppState.currentState === "active") tick(TICK_SECONDS, today);
    }, TICK_SECONDS * 1000);
    return () => clearInterval(id);
  }, [active, tick, today, extensionUntil]);

  const usedSeconds = usage.date === today ? usage.seconds : 0;
  const remainingSeconds = Math.max(0, limitMinutes * 60 - usedSeconds);

  useEffect(() => {
    if (!active || extended) return;
    if (remainingSeconds > 0 && remainingSeconds <= WARN_AT_SECONDS && warnedFor.current !== today) {
      warnedFor.current = today;
      toast({ title: "2 minutes left for today", body: "Finish up, then come back tomorrow!", emoji: "⏳" });
    }
  }, [active, extended, remainingSeconds, today]);

  return { usedSeconds, remainingSeconds, limitMinutes, blocked: remainingSeconds <= 0 && !extended };
}
