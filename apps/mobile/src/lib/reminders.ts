import { formatINR, nextPayoutDate, pendingApprovals, type FamilyState } from "@finlit/core";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const supported = Platform.OS === "ios" || Platform.OS === "android";

/** Call once at startup so scheduled reminders are shown while the app is open. */
export function configureNotifications(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Re-plan local reminders from the current family state. Idempotent: clears everything and
 * schedules afresh, so call it after hydration and whenever the state changes (debounced).
 *  - allowance day, 8:00, per active rule
 *  - daily streak nudge at 18:30 while any kid has a streak
 *  - one nudge in 3 hours while chores wait for approval
 */
export async function syncReminders(state: FamilyState): Promise<number> {
  if (!supported) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!state.settings.remindersEnabled) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return 0;

  let scheduled = 0;
  const now = new Date();
  for (const rule of state.allowanceRules) {
    if (!rule.active || rule.amountPaise <= 0) continue;
    const kid = state.kids.find((k) => k.id === rule.kidId);
    if (!kid) continue;
    const date = nextPayoutDate(rule, now);
    date.setHours(8, 0, 0, 0);
    if (date.getTime() <= now.getTime()) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: "Pocket money day! 💸", body: `${formatINR(rule.amountPaise, { showPaise: false })} lands in ${kid.name}'s jars today.` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
    scheduled += 1;
  }

  if (state.streaks.some((s) => s.current > 0)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Keep the streak alive 🔥", body: "One quick lesson before bed keeps the flame burning." },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 18, minute: 30 },
    });
    scheduled += 1;
  }

  const waiting = pendingApprovals(state).count;
  if (waiting > 0) {
    await Notifications.scheduleNotificationAsync({
      content: { title: `${waiting} chore${waiting === 1 ? "" : "s"} waiting for your thumbs-up 👍`, body: "Approve it and the money lands in their jars." },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 * 60 * 60, repeats: false },
    });
    scheduled += 1;
  }
  return scheduled;
}
