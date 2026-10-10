import { StyleSheet, View } from "react-native";

import { Button } from "./Button";
import { Text } from "./Text";
import { useTheme } from "@/design";

export interface EmptyStateProps {
  emoji: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, body, actionLabel, onAction }: EmptyStateProps) {
  const { space } = useTheme();
  return (
    <View style={[styles.wrap, { padding: space.xxl, gap: space.sm }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text variant="h3" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="caption" tone="muted" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: space.md }}>
          <Button title={actionLabel} onPress={onAction} size="sm" variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 44, lineHeight: 52 },
});
