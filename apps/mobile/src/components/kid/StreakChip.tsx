import type { StreakStatus } from "@finlit/core";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { Text } from "@/components/ui";
import { useTheme } from "@/design";

export interface StreakChipProps {
  count: number;
  status: StreakStatus;
  size?: "sm" | "lg";
}

/** Duolingo-style streak flame. Pulses when the streak is at risk today. */
export function StreakChip({ count, status, size = "sm" }: StreakChipProps) {
  const { colors, radius, fontFamily } = useTheme();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (status === "at_risk") {
      scale.value = withRepeat(withSequence(withTiming(1.15, { duration: 500, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 500 })), -1, true);
    } else {
      scale.value = withTiming(1);
    }
  }, [status, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const lit = status === "active" || status === "at_risk";
  const bg = lit ? colors.streakSoft : colors.bgAlt;
  const fg = lit ? "#C2410C" : colors.textSoft;
  const big = size === "lg";
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderRadius: radius.pill, paddingVertical: big ? 8 : 5, paddingHorizontal: big ? 14 : 10 }]}>
      <Animated.View style={anim}>
        <Text style={{ fontSize: big ? 22 : 16, opacity: lit ? 1 : 0.5 }}>🔥</Text>
      </Animated.View>
      <Text style={{ fontFamily: fontFamily.black, fontSize: big ? 20 : 14, lineHeight: big ? 26 : 18, color: fg }}>{count}</Text>
      {big ? (
        <Text style={{ fontFamily: fontFamily.bold, fontSize: 13, color: fg }}>
          {status === "at_risk" ? "day streak · keep it alive!" : status === "active" ? "day streak" : "Start a streak"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
});
