import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/design";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  emoji?: string;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction, emoji }: SectionHeaderProps) {
  const { space } = useTheme();
  return (
    <View style={[styles.row, { marginBottom: space.md }]}>
      <View style={styles.titles}>
        <View style={styles.titleRow}>
          {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
          <Text variant="h2">{title}</Text>
        </View>
        {subtitle ? (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Text variant="captionStrong" tone="primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  titles: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  emoji: { fontSize: 20 },
  pressed: { opacity: 0.6 },
});
