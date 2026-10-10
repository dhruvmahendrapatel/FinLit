import type { LevelStatus } from "@finlit/core";
import { StyleSheet, View } from "react-native";

import { ProgressRing, Text } from "@/components/ui";
import { useTheme } from "@/design";

export function LevelBadge({ level, size = 64 }: { level: LevelStatus; size?: number }) {
  const { colors, fontFamily } = useTheme();
  return (
    <View style={styles.wrap}>
      <ProgressRing percent={level.progressPercent} size={size} stroke={6} color={colors.accent} trackColor={colors.accentSoft}>
        <Text style={{ fontFamily: fontFamily.black, fontSize: size * 0.34, color: colors.text }}>{level.level}</Text>
      </ProgressRing>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: "center", justifyContent: "center" } });
