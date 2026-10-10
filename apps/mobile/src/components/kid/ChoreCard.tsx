import { relativeDayLabel, type Chore } from "@finlit/core";
import { StyleSheet, View } from "react-native";

import { Button, Card, Chip, Money, Text } from "@/components/ui";
import { useTheme } from "@/design";

export interface ChoreCardProps {
  chore: Chore;
  today: string;
  /** Primary action label, e.g. "I'll do it" / "Mark done" */
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Kid name shown when the viewer is a parent */
  assigneeName?: string;
}

const STATUS_CHIP: Record<Chore["status"], { label: string; tone: "neutral" | "primary" | "warning" | "success" | "danger"; emoji: string } | null> = {
  open: null,
  claimed: { label: "In progress", tone: "primary", emoji: "💪" },
  submitted: { label: "Waiting for approval", tone: "warning", emoji: "⏳" },
  approved: { label: "Paid", tone: "success", emoji: "✅" },
  rejected: { label: "Try again", tone: "danger", emoji: "🔁" },
};

export function ChoreCard({ chore, today, actionLabel, onAction, secondaryLabel, onSecondary, assigneeName }: ChoreCardProps) {
  const { colors, radius, space } = useTheme();
  const status = STATUS_CHIP[chore.status];
  const due = chore.dueOn ? relativeDayLabel(chore.dueOn, today) : null;
  return (
    <Card radius={radius.xl}>
      <View style={styles.row}>
        <View style={[styles.emoji, { backgroundColor: colors.bgAlt, borderRadius: radius.md }]}>
          <Text style={{ fontSize: 26 }}>{chore.emoji}</Text>
        </View>
        <View style={styles.text}>
          <Text variant="h3" numberOfLines={2}>
            {chore.title}
          </Text>
          <View style={styles.meta}>
            {due ? (
              <Text variant="caption" tone="muted">
                {due}
              </Text>
            ) : null}
            {chore.recurrence !== "once" ? (
              <Text variant="caption" tone="muted">
                · {chore.recurrence === "daily" ? "Every day" : "Weekly"}
              </Text>
            ) : null}
            {assigneeName ? (
              <Text variant="caption" tone="muted">
                · {assigneeName}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.reward, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
          <Money paise={chore.rewardPaise} variant="captionStrong" color={colors.accentDark} />
        </View>
      </View>
      {status ? (
        <View style={{ marginTop: space.md }}>
          <Chip label={status.label} tone={status.tone} emoji={status.emoji} size="sm" />
        </View>
      ) : null}
      {chore.status === "rejected" && chore.rejectReason ? (
        <Text variant="caption" tone="danger" style={{ marginTop: space.sm }}>
          “{chore.rejectReason}”
        </Text>
      ) : null}
      {chore.proofNote && chore.status === "submitted" ? (
        <Text variant="caption" tone="muted" style={{ marginTop: space.sm }}>
          Note: “{chore.proofNote}”
        </Text>
      ) : null}
      {actionLabel || secondaryLabel ? (
        <View style={[styles.actions, { marginTop: space.md }]}>
          {secondaryLabel && onSecondary ? <Button title={secondaryLabel} onPress={onSecondary} variant="surface" size="sm" /> : null}
          {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} size="sm" style={styles.grow} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  reward: { paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  grow: { flexGrow: 1 },
});
