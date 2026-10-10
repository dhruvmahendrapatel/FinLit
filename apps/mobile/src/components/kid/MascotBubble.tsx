import { StyleSheet, View } from "react-native";

import { Avatar, Text } from "@/components/ui";
import { useTheme } from "@/design";
import type { AvatarId } from "@finlit/core";

export interface MascotBubbleProps {
  avatar: AvatarId;
  message: string;
}

/** The kid's avatar "talking" — used for nudges on the home screen. */
export function MascotBubble({ avatar, message }: MascotBubbleProps) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.row}>
      <Avatar avatar={avatar} size={52} ring />
      <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <View style={[styles.tail, { backgroundColor: colors.surface, borderColor: colors.border }]} />
        <Text variant="body">{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  bubble: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1 },
  tail: {
    position: "absolute",
    left: -7,
    top: "50%",
    width: 14,
    height: 14,
    marginTop: -7,
    transform: [{ rotate: "45deg" }],
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
});
