import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/design";
import { haptic } from "@/lib/haptics";

export interface CardProps {
  children: ReactNode;
  /** Background override (soft tints for jars etc.) */
  tint?: string;
  borderColor?: string;
  onPress?: () => void;
  padding?: number;
  radius?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({ children, tint, borderColor, onPress, padding, radius, elevated = true, style, testID }: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: tint ?? theme.colors.surface,
    borderRadius: radius ?? theme.radius.lg,
    padding: padding ?? theme.space.lg,
    borderWidth: 1,
    borderColor: borderColor ?? theme.colors.border,
  };
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPressIn={() => haptic.tap()}
        onPress={onPress}
        style={({ pressed }) => [base, elevated && theme.shadow.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[base, elevated && theme.shadow.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
});
