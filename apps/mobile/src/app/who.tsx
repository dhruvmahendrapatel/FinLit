import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Avatar, Icon, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useFamilyState } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";

/** Netflix-style profile picker: kids tap their avatar, parents go through the PIN. */
export default function Who() {
  const { colors, space, radius, shadow } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const enterKid = useSessionStore((s) => s.enterKid);
  const isUnlocked = useSessionStore((s) => s.isParentUnlocked);
  const enterParent = useSessionStore((s) => s.enterParent);

  const openParent = () => {
    if (isUnlocked()) {
      enterParent();
      router.replace("/parent");
    } else {
      router.push({ pathname: "/pin", params: { next: "/parent" } });
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={{ gap: space.xs, alignItems: "center", marginTop: space.xxl }}>
        <Text variant="display" align="center">
          Who’s here?
        </Text>
        <Text variant="body" tone="muted" align="center">
          {state.family?.name ?? "Your family"}
        </Text>
      </View>

      <View style={[styles.grid, { gap: space.lg, marginTop: space.xxxl }]}>
        {state.kids.map((kid, i) => (
          <Animated.View key={kid.id} entering={FadeInUp.delay(i * 80)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Enter as ${kid.name}`}
              onPress={() => {
                enterKid(kid.id);
                router.replace("/kid");
              }}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <Avatar avatar={kid.avatar} size={108} ring style={shadow.raised} />
              <Text variant="h2">{kid.name}</Text>
              <Text variant="caption" tone="muted">
                Age {kid.age}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
        <Animated.View entering={FadeInUp.delay(state.kids.length * 80)}>
          <Pressable accessibilityRole="button" accessibilityLabel="Enter parent mode" onPress={openParent} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={[styles.parentTile, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 54 }, shadow.raised]}>
              <Text style={{ fontSize: 44 }}>{state.parent?.avatarEmoji ?? "🧑"}</Text>
              <View style={[styles.lock, { backgroundColor: colors.primary, borderColor: colors.bg }]}>
                <Icon name="lock-closed" size={14} color="#fff" />
              </View>
            </View>
            <Text variant="h2">Parents</Text>
            <Text variant="caption" tone="muted">
              PIN protected
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      <Pressable onPress={() => router.replace("/welcome")} style={[styles.footer, { borderRadius: radius.pill }]} hitSlop={8}>
        <Text variant="captionStrong" tone="soft">
          Not your family? Start over
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  tile: { alignItems: "center", gap: 6, width: 150 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  parentTile: { width: 108, height: 108, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  lock: { position: "absolute", right: 2, bottom: 2, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 3 },
  footer: { marginTop: "auto", alignSelf: "center", padding: 12 },
});
