import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { Icon, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { haptic } from "@/lib/haptics";
import { useFamilyState } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinScreen() {
  const { colors, space, fontFamily, shadow } = useTheme();
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const parent = useFamilyState().parent;
  const isDemo = useFamilyState().family?.id.startsWith("demo_") ?? false;
  const unlockParent = useSessionStore((s) => s.unlockParent);
  const enterParent = useSessionStore((s) => s.enterParent);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const verify = (candidate: string) => {
    if (candidate === parent?.pin) {
      haptic.success();
      unlockParent();
      enterParent();
      router.replace((next ?? "/parent") as Href);
      return;
    }
    haptic.error();
    setError(true);
    shake.set(withSequence(withTiming(-12, { duration: 60 }), withTiming(12, { duration: 60 }), withTiming(-8, { duration: 60 }), withTiming(0, { duration: 60 })));
    setTimeout(() => {
      setPin("");
      setError(false);
    }, 500);
  };

  const press = (k: string) => {
    if (k === "") return;
    haptic.tap();
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const candidate = pin + k;
    setPin(candidate);
    if (candidate.length === 4) verify(candidate);
  };

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <IconButton name="close" accessibilityLabel="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace("/who"))} />
      </View>
      <View style={{ alignItems: "center", gap: space.sm, marginTop: space.lg }}>
        <View style={[styles.lockBadge, { backgroundColor: colors.primarySoft }]}>
          <Icon name="lock-closed" size={28} color={colors.primary} />
        </View>
        <Text variant="title" align="center">
          Parents only
        </Text>
        <Text variant="body" tone="muted" align="center">
          Enter your 4-digit PIN{parent ? `, ${parent.name.split(" ")[0]}` : ""}
        </Text>
        {isDemo ? (
          <Text variant="caption" tone="soft">
            Demo family PIN: 1234
          </Text>
        ) : null}
      </View>

      <Animated.View style={[styles.dots, shakeStyle, { marginTop: space.xxl }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: error ? colors.danger : i < pin.length ? colors.primary : colors.bgAlt,
                borderColor: error ? colors.danger : colors.borderStrong,
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={[styles.pad, { marginTop: space.xxxl }]}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            disabled={k === ""}
            accessibilityRole="button"
            accessibilityLabel={k === "⌫" ? "Delete" : k}
            onPress={() => press(k)}
            style={({ pressed }) => [
              styles.key,
              k !== "" && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              k !== "" && shadow.card,
              pressed && styles.keyPressed,
            ]}
          >
            {k === "⌫" ? <Icon name="backspace-outline" size={26} /> : <Text style={{ fontFamily: fontFamily.extraBold, fontSize: 26, color: colors.text }}>{k}</Text>}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "flex-end" },
  lockBadge: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 18 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  pad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: 300, alignSelf: "center" },
  key: { width: 82, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  keyPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
