import { goalProgress, type Goal } from "@finlit/core";
import { StyleSheet, View } from "react-native";

import { Card, Chip, Money, ProgressBar, Text } from "@/components/ui";
import { useTheme } from "@/design";

export interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  showKidMatch?: boolean;
}

export function GoalCard({ goal, onPress, showKidMatch = true }: GoalCardProps) {
  const { colors, radius, space } = useTheme();
  const progress = goalProgress(goal);
  const reached = goal.status !== "active";
  return (
    <Card onPress={onPress} radius={radius.xl}>
      <View style={styles.row}>
        <View style={[styles.emoji, { backgroundColor: reached ? colors.accentSoft : colors.primarySoft, borderRadius: radius.md }]}>
          <Text style={{ fontSize: 28 }}>{goal.emoji}</Text>
        </View>
        <View style={styles.text}>
          <Text variant="h3" numberOfLines={1}>
            {goal.title}
          </Text>
          <View style={styles.amounts}>
            <Money paise={progress.fundedPaise} variant="bodyStrong" />
            <Text variant="caption" tone="muted">
              {" "}
              of <Money paise={goal.targetPaise} variant="caption" tone="muted" />
            </Text>
          </View>
        </View>
        {reached ? (
          <Chip label={goal.status === "redeemed" ? "Got it!" : "Reached"} tone="success" emoji="🎉" size="sm" />
        ) : (
          <Text variant="h3" tone="primary">
            {Math.round(progress.percent)}%
          </Text>
        )}
      </View>
      <ProgressBar percent={progress.percent} color={reached ? colors.success : colors.primary} style={{ marginTop: space.md }} />
      {showKidMatch && goal.parentMatchPercent > 0 && !reached ? (
        <Text variant="caption" tone="muted" style={{ marginTop: space.sm }}>
          🎁 Parents add {goal.parentMatchPercent}% on every rupee you save
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
  amounts: { flexDirection: "row", alignItems: "baseline" },
});
