import type { Kid } from "@finlit/core";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

import { Avatar, Button, Icon, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useSessionStore } from "@/store/session-store";

/** Gentle stop screen shown in kid mode once the daily limit is spent. */
export function TimeUp({ kid, limitMinutes }: { kid: Kid | null; limitMinutes: number }) {
  const { colors, space } = useTheme();
  const router = useRouter();
  const isUnlocked = useSessionStore((s) => s.isParentUnlocked);
  const grantExtension = useSessionStore((s) => s.grantExtension);

  const parentExtend = () => {
    if (isUnlocked()) {
      grantExtension(10);
      return;
    }
    router.push({ pathname: "/pin", params: { next: "/kid/extend" } });
  };

  return (
    <Screen scroll={false} contentStyle={styles.center} testID="time-up">
      <Animated.View entering={ZoomIn.springify()} style={{ alignItems: "center", gap: space.md }}>
        {kid ? <Avatar avatar={kid.avatar} size={120} ring /> : <Text style={{ fontSize: 80 }}>🌙</Text>}
        <Text variant="display" align="center">
          That’s all for today!
        </Text>
        <Text variant="body" tone="muted" align="center">
          You’ve used your {limitMinutes} minutes of Chillar. Your jars keep growing while you’re away. See you tomorrow{kid ? `, ${kid.name}` : ""}!
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(300)} style={{ marginTop: space.xxxl, gap: space.sm, alignSelf: "stretch" }}>
        <Button title="Switch profile" variant="secondary" size="lg" full onPress={() => router.replace("/who")} />
        <Button title="I’m a parent · 10 more minutes" variant="ghost" size="sm" full icon={<Icon name="lock-closed" size={16} color={colors.primary} />} onPress={parentExtend} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
