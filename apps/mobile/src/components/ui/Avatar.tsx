import { AVATARS, type AvatarId } from "@finlit/core";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/design";

export interface AvatarProps {
  avatar?: AvatarId;
  emoji?: string;
  color?: string;
  size?: number;
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ avatar, emoji, color, size = 56, ring = false, style }: AvatarProps) {
  const { colors } = useTheme();
  const meta = avatar ? AVATARS[avatar] : null;
  const bg = color ?? meta?.color ?? colors.primarySoft;
  const glyph = emoji ?? meta?.emoji ?? "🙂";
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: ring ? Math.max(3, size * 0.06) : 0,
          borderColor: colors.surface,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.52, lineHeight: size * 0.7 }}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
