import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/design";
import { haptic } from "@/lib/haptics";

export type ButtonVariant = "primary" | "secondary" | "accent" | "surface" | "ghost" | "danger" | "premium" | "custom";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon or emoji */
  icon?: ReactNode;
  /** Stretch to the container width */
  full?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** For variant="custom": the face and the 3D edge colours */
  tint?: string;
  tintDark?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 40, md: 52, lg: 60 };
const FONT: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };
const PADX: Record<ButtonSize, number> = { sm: 14, md: 20, lg: 26 };
const EDGE = 4;

/**
 * Chunky, tactile button: a darker "edge" underneath that collapses on press,
 * the pattern kids' apps like Duolingo and ClassDojo use for a toy-like feel.
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  full = false,
  loading = false,
  disabled = false,
  tint,
  tintDark,
  textColor,
  style,
  testID,
}: ButtonProps) {
  const { colors, radius, fontFamily, mode } = useTheme();
  const palette: Record<ButtonVariant, { face: string; edge: string; text: string; border?: string }> = {
    primary: { face: colors.primary, edge: colors.primaryDark, text: colors.textOnPrimary },
    secondary: { face: colors.primarySoft, edge: "#CFC7FF", text: colors.primaryDark },
    accent: { face: colors.accent, edge: colors.accentDark, text: "#3A2A00" },
    surface: { face: colors.surface, edge: colors.borderStrong, text: colors.text, border: colors.border },
    ghost: { face: "transparent", edge: "transparent", text: colors.primary },
    danger: { face: colors.danger, edge: "#B42318", text: colors.textOnPrimary },
    premium: { face: colors.premium, edge: colors.premiumDark, text: "#3A2A00" },
    custom: { face: tint ?? colors.primary, edge: tintDark ?? colors.primaryDark, text: textColor ?? colors.textOnPrimary },
  };
  const p = palette[variant];
  const height = HEIGHTS[size];
  const isGhost = variant === "ghost";
  const edge = isGhost ? 0 : EDGE;
  const borderRadius = mode === "kid" ? radius.pill : size === "sm" ? radius.sm : radius.md;
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPressIn={() => haptic.tap()}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        { height: height + edge, borderRadius, backgroundColor: p.edge, opacity: inactive ? 0.55 : 1 },
        full ? styles.full : styles.hug,
        pressed && !isGhost && { backgroundColor: "transparent" },
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.face,
            {
              height,
              borderRadius,
              backgroundColor: p.face,
              paddingHorizontal: PADX[size],
              transform: [{ translateY: pressed && !isGhost ? edge : 0 }],
              borderWidth: p.border ? 1.5 : 0,
              borderColor: p.border,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={p.text} />
          ) : (
            <>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <Text
                numberOfLines={1}
                style={{ fontFamily: fontFamily.extraBold, fontSize: FONT[size], color: textColor ?? p.text, lineHeight: FONT[size] + 6 }}
              >
                {title}
              </Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { overflow: "visible" },
  full: { alignSelf: "stretch" },
  hug: { alignSelf: "flex-start" },
  face: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  icon: { alignItems: "center", justifyContent: "center" },
});
