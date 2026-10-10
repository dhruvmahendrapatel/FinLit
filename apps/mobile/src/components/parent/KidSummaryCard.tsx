import type { KidSummary } from "@finlit/core";
import { StyleSheet, View } from "react-native";

import { Avatar, Card, Chip, Icon, Money, Text } from "@/components/ui";
import { useTheme } from "@/design";

export function KidSummaryCard({ summary, onPress }: { summary: KidSummary; onPress: () => void }) {
  const { colors, space } = useTheme();
  const { kid } = summary;
  const waiting = summary.pendingChores.filter((c) => c.status === "submitted").length;
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <Avatar avatar={kid.avatar} size={56} />
        <View style={styles.text}>
          <View style={styles.nameRow}>
            <Text variant="h3">{kid.name}</Text>
            <Text variant="caption" tone="muted">
              {kid.age} · {summary.level.title}
            </Text>
          </View>
          <View style={styles.chips}>
            <Chip label={`${summary.streak} day streak`} emoji="🔥" tone={summary.streakStatus === "broken" || summary.streakStatus === "none" ? "neutral" : "streak"} size="sm" />
            <Chip label={`${summary.lessonsCompleted}/${summary.lessonsTotal} lessons`} emoji="📚" tone="primary" size="sm" />
          </View>
        </View>
        <View style={styles.right}>
          <Money paise={summary.netWorthPaise} variant="h3" />
          <Text variant="caption" tone="muted">
            net worth
          </Text>
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: colors.border, marginTop: space.md, paddingTop: space.md }]}>
        <View style={styles.footItem}>
          <Text variant="caption" tone="muted">
            Save jar
          </Text>
          <Money paise={summary.jars.save} variant="captionStrong" color={colors.jars.save.dark} />
        </View>
        <View style={styles.footItem}>
          <Text variant="caption" tone="muted">
            This week
          </Text>
          <Money paise={summary.earnedThisWeekPaise} variant="captionStrong" signed />
        </View>
        <View style={styles.footItem}>
          <Text variant="caption" tone="muted">
            To approve
          </Text>
          <Text variant="captionStrong" tone={waiting > 0 ? "warning" : "default"}>
            {waiting}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textSoft} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  right: { alignItems: "flex-end" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, gap: 8 },
  footItem: { gap: 2 },
});
