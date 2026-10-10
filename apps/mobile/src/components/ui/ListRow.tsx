import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/design";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  leading?: ReactNode;
  leadingColor?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}

export function ListRow({ title, subtitle, emoji, leading, leadingColor, trailing, onPress, last = false }: ListRowProps) {
  const { colors, space, radius } = useTheme();
  const body = (
    <View style={[styles.row, { paddingVertical: space.md, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }]}>
      {leading ?? (
        <View style={[styles.leading, { backgroundColor: leadingColor ?? colors.bgAlt, borderRadius: radius.md }]}>
          <Text style={styles.emoji}>{emoji ?? "•"}</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  leading: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 22 },
  text: { flex: 1, gap: 2 },
  trailing: { alignItems: "flex-end" },
  pressed: { opacity: 0.7 },
});
