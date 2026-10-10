import type { PathLesson } from "@finlit/core";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { Icon, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { haptic } from "@/lib/haptics";

export interface LessonNodeProps {
  item: PathLesson;
  unitColor: string;
  isNext: boolean;
  onPress: () => void;
  /** Horizontal offset for the zig-zag path */
  offset: number;
}

const SIZE = 76;
const EDGE = 6;

/** A node on the learning path: done (gold), next (unit colour, bouncing), locked (grey / premium gold lock). */
export function LessonNode({ item, unitColor, isNext, onPress, offset }: LessonNodeProps) {
  const { colors, fontFamily } = useTheme();
  const { availability, lesson } = item;
  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.value = isNext
      ? withRepeat(withSequence(withTiming(-6, { duration: 600, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 600 })), -1, true)
      : withTiming(0);
  }, [isNext, bounce]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  const locked = !availability.unlocked;
  const premium = availability.reason === "premium";
  const face = availability.completed ? colors.accent : locked ? (premium ? colors.premiumSoft : colors.bgAlt) : unitColor;
  const edge = availability.completed ? colors.accentDark : locked ? colors.borderStrong : shade(unitColor);

  return (
    <View style={[styles.row, { paddingLeft: offset }]}>
      <Animated.View style={anim}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lesson.title}
          onPressIn={() => haptic.tap()}
          onPress={onPress}
          style={({ pressed }) => [styles.outer, { backgroundColor: edge }, pressed && { backgroundColor: "transparent" }]}
        >
          {({ pressed }) => (
            <View style={[styles.face, { backgroundColor: face, transform: [{ translateY: pressed ? EDGE : 0 }] }]}>
              {locked ? (
                <Icon name="lock-closed" size={26} color={premium ? colors.premiumDark : colors.textSoft} />
              ) : (
                <Text style={{ fontSize: 32 }}>{lesson.emoji}</Text>
              )}
              {availability.completed ? (
                <View style={[styles.check, { backgroundColor: colors.success, borderColor: colors.bg }]}>
                  <Icon name="checkmark" size={14} color="#fff" />
                </View>
              ) : null}
            </View>
          )}
        </Pressable>
        {isNext ? (
          <View style={[styles.startTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontFamily: fontFamily.black, fontSize: 11, color: unitColor, letterSpacing: 0.6 }}>START</Text>
          </View>
        ) : null}
      </Animated.View>
      <View style={styles.label}>
        <Text variant="bodyStrong" numberOfLines={2} tone={locked ? "muted" : "default"}>
          {lesson.title}
        </Text>
        <Text variant="caption" tone="soft">
          {availability.completed
            ? `Done · ${availability.scorePercent ?? 0}%`
            : premium
              ? "Family Premium"
              : locked
                ? "Finish the previous lesson"
                : `${lesson.minutes} min · ${lesson.xp} XP`}
        </Text>
      </View>
    </View>
  );
}

function shade(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 },
  outer: { width: SIZE, height: SIZE + EDGE, borderRadius: SIZE / 2 },
  face: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: "center", justifyContent: "center" },
  check: { position: "absolute", right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 3 },
  startTag: { position: "absolute", top: -14, alignSelf: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1.5 },
  label: { flex: 1, gap: 2 },
});
