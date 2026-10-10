import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/design";

export type ChipTone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger" | "premium" | "streak" | "info";

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  emoji?: string;
  icon?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, tone = "neutral", emoji, icon, selected = false, onPress, size = "md", style }: ChipProps) {
  const { colors, radius, fontFamily } = useTheme();
  const tones: Record<ChipTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.bgAlt, fg: colors.textMuted },
    primary: { bg: colors.primarySoft, fg: colors.primaryDark },
    accent: { bg: colors.accentSoft, fg: colors.accentDark },
    success: { bg: colors.successSoft, fg: "#15803D" },
    warning: { bg: colors.warningSoft, fg: "#C2410C" },
    danger: { bg: colors.dangerSoft, fg: "#B42318" },
    premium: { bg: colors.premiumSoft, fg: colors.premiumDark },
    streak: { bg: colors.streakSoft, fg: "#C2410C" },
    info: { bg: colors.infoSoft, fg: "#1D6FB8" },
  };
  const t = tones[tone];
  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : t.bg,
          borderRadius: radius.pill,
          paddingVertical: size === "sm" ? 4 : 7,
          paddingHorizontal: size === "sm" ? 10 : 12,
          borderWidth: selected ? 0 : 1,
          borderColor: "transparent",
        },
        style,
      ]}
    >
      {emoji ? <Text style={{ fontSize: size === "sm" ? 12 : 14 }}>{emoji}</Text> : null}
      {icon}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fontFamily.extraBold,
          fontSize: size === "sm" ? 12 : 13,
          lineHeight: size === "sm" ? 16 : 18,
          color: selected ? colors.textOnPrimary : t.fg,
        }}
      >
        {label}
      </Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", maxWidth: "100%", flexShrink: 1 },
  pressed: { opacity: 0.8 },
});
