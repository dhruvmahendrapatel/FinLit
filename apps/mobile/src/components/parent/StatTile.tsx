import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Card, Text } from "@/components/ui";
import { useTheme } from "@/design";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  emoji?: string;
  tint?: string;
  onPress?: () => void;
}

export function StatTile({ label, value, hint, emoji, tint, onPress }: StatTileProps) {
  const { space } = useTheme();
  return (
    <Card onPress={onPress} tint={tint} padding={space.lg} style={styles.tile}>
      <View style={styles.head}>
        <Text variant="label" tone="muted">
          {label}
        </Text>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      </View>
      <View style={{ marginTop: space.sm }}>{typeof value === "string" ? <Text variant="money">{value}</Text> : value}</View>
      {hint ? (
        <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 150 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  emoji: { fontSize: 18 },
});
