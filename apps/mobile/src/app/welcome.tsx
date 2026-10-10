import { isOnboarded } from "@finlit/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, Platform, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Button, Card, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useFamilyStore } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const PILLARS = [
  { emoji: "💪", title: "Earn", body: "Chores and allowance, approved by you" },
  { emoji: "🐷", title: "Save", body: "Four jars, goals and parent-paid interest" },
  { emoji: "🎓", title: "Learn", body: "3-minute lessons mapped to NCFE & CBSE" },
];

export default function Welcome() {
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const loadDemo = useFamilyStore((s) => s.loadDemo);
  const onboarded = useFamilyStore((s) => isOnboarded(s.state));

  const tryDemo = () => {
    loadDemo();
    toast({ title: "Demo family loaded", body: "Meet the Sharmas from Pune. Parent PIN is 1234.", emoji: "👋" });
    router.replace("/who");
  };

  return (
    <Screen padded={false} edges={["left", "right"]} contentStyle={styles.content}>
      <LinearGradient colors={["#5B4DFF", "#7C6BFF", "#B3A7FF"]} style={[styles.hero, { paddingTop: Platform.OS === "web" ? 64 : 84 }]}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.coinWrap}>
          <Image source={require("@/assets/images/coin.png")} style={styles.coin} />
          <Text style={styles.sparkle}>✨</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(150).duration(600)}>
          <Text variant="display" tone="onPrimary" align="center">
            Chillar
          </Text>
          <Text variant="h3" color="#EDEBFF" align="center" style={{ marginTop: 4 }}>
            Raise money-smart kids
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={[styles.body, { padding: space.lg, gap: space.md }]}>
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ gap: space.sm }}>
          {PILLARS.map((p) => (
            <Card key={p.title} padding={space.md} radius={radius.lg}>
              <View style={styles.pillar}>
                <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{p.title}</Text>
                  <Text variant="caption" tone="muted">
                    {p.body}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(450).duration(500)} style={{ gap: space.sm, marginTop: space.sm }}>
          <Button title="Set up my family" size="lg" full onPress={() => router.push("/onboarding/parent")} />
          <Button title={onboarded ? "Continue" : "Try the demo family"} variant="secondary" size="lg" full onPress={onboarded ? () => router.replace("/who") : tryDemo} />
          <Button title="I’m a kid · join with a code" variant="ghost" size="sm" full onPress={() => router.push("/join")} />
          <Text variant="caption" tone="soft" align="center" style={{ marginTop: space.xs }}>
            Free for every family · No ads inside lessons · Parent-controlled, DPDP-ready
          </Text>
        </Animated.View>
      </View>
      <View style={{ height: 24, backgroundColor: colors.bg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 0 },
  hero: { alignItems: "center", paddingBottom: 36, paddingHorizontal: 24, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  coinWrap: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  coin: { width: 130, height: 130 },
  sparkle: { position: "absolute", top: -6, right: -10, fontSize: 30 },
  body: { flex: 1 },
  pillar: { flexDirection: "row", alignItems: "center", gap: 14 },
});
