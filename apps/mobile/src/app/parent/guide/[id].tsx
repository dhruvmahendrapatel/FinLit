import { AGE_BANDS, PARENT_GUIDES } from "@finlit/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Card, Chip, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";

export default function GuideDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const guide = PARENT_GUIDES.find((g) => g.id === id);
  if (!guide) return null;
  return (
    <Screen>
      <IconButton name="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
      <View style={[styles.hero, { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: space.xl, marginTop: space.lg }]}>
        <Text style={{ fontSize: 56 }}>{guide.emoji}</Text>
        <Text variant="title" style={{ marginTop: space.sm }}>
          {guide.title}
        </Text>
        <View style={styles.chips}>
          <Chip label={`${guide.minutes} min read`} size="sm" />
          <Chip label={guide.ageBand === "all" ? "All ages" : `${AGE_BANDS[guide.ageBand].label}s (${AGE_BANDS[guide.ageBand].min}–${AGE_BANDS[guide.ageBand].max})`} size="sm" tone="primary" />
        </View>
      </View>
      <Text variant="body" style={{ marginTop: space.xl, fontSize: 17, lineHeight: 26 }}>
        {guide.summary}
      </Text>
      <Text variant="h2" style={{ marginTop: space.xl }}>
        Try this week
      </Text>
      <View style={{ gap: space.md, marginTop: space.md }}>
        {guide.tips.map((tip, i) => (
          <Card key={i} padding={space.md}>
            <View style={styles.tipRow}>
              <View style={[styles.num, { backgroundColor: colors.primary }]}>
                <Text variant="captionStrong" color="#fff">
                  {i + 1}
                </Text>
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {tip}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "flex-start" },
  chips: { flexDirection: "row", gap: 8, marginTop: 10 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 1 },
});
