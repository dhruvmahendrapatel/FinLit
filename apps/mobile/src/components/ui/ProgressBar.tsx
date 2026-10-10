import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useTheme } from "@/design";

export interface ProgressBarProps {
  /** 0–100 */
  percent: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({ percent, color, trackColor, height = 12, style }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));
  const width = useSharedValue(clamped);
  useEffect(() => {
    width.value = withTiming(clamped, { duration: 600 });
  }, [clamped, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: radius.pill, backgroundColor: trackColor ?? colors.bgAlt }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: radius.pill, backgroundColor: color ?? colors.primary }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden", width: "100%" },
  fill: { height: "100%" },
});
