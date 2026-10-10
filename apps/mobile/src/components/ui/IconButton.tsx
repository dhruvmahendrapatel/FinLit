import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { Icon, type IconName } from "./Icon";
import { useTheme } from "@/design";
import { haptic } from "@/lib/haptics";

export interface IconButtonProps {
  name: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ name, onPress, size = 40, color, bg, accessibilityLabel, style }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => haptic.tap()}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name={name} size={size * 0.5} color={color ?? colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
