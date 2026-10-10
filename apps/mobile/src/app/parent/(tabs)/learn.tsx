import { AGE_BANDS, nextLessonFor, PARENT_GUIDES } from "@finlit/core";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { UpsellCard } from "@/components/monetization";
import { Avatar, Card, Chip, ListRow, ProgressRing, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useFamilyOverview } from "@/hooks/use-family";
import { useFamilyState } from "@/store/family-store";

export default function ParentLearn() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const overview = useFamilyOverview();

  return (
    <Screen tabBarInset>
      <Text variant="title">Learning</Text>
      <Text variant="body" tone="muted">
        3-minute lessons mapped to the NCFE and CBSE financial-literacy workbooks
      </Text>

      <View style={{ gap: space.md, marginTop: space.xl }}>
        {overview.kids.map((s) => {
          const next = nextLessonFor(state, s.kid.id);
          const pct = s.lessonsTotal ? (s.lessonsCompleted / s.lessonsTotal) * 100 : 0;
          return (
            <Card key={s.kid.id} onPress={() => router.push({ pathname: "/parent/kid/[id]", params: { id: s.kid.id } })}>
              <View style={styles.row}>
                <ProgressRing percent={pct} size={72} stroke={8} color={colors.primary}>
                  <Avatar avatar={s.kid.avatar} size={48} />
                </ProgressRing>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="h3">
                    {s.kid.name} · {AGE_BANDS[s.kid.ageBand].label}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {s.lessonsCompleted}/{s.lessonsTotal} lessons · Level {s.level.level} {s.level.title} · {s.level.xp} XP
                  </Text>
                  <View style={styles.chips}>
                    <Chip label={`${s.streak} day streak`} emoji="🔥" tone={s.streakStatus === "active" || s.streakStatus === "at_risk" ? "streak" : "neutral"} size="sm" />
                    {next ? <Chip label={`Next: ${next.lesson.title}`} emoji={next.lesson.emoji} tone="primary" size="sm" style={{ flexShrink: 1 }} /> : <Chip label="Path complete" emoji="🏆" tone="success" size="sm" />}
                  </View>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: space.xl }}>
        <UpsellCard feature="full_library" headline="Unlock every lesson, simulation and the AI coach" />
      </View>

      <View style={{ marginTop: space.xxl }}>
        <SectionHeader title="Parent guides" emoji="📖" subtitle="Short reads on money talk at every age" />
        <Card padding={space.sm}>
          {PARENT_GUIDES.map((g, i) => (
            <ListRow
              key={g.id}
              emoji={g.emoji}
              leadingColor={colors.primarySoft}
              title={g.title}
              subtitle={`${g.minutes} min · ${g.ageBand === "all" ? "All ages" : `${AGE_BANDS[g.ageBand].label}s`}`}
              onPress={() => router.push({ pathname: "/parent/guide/[id]", params: { id: g.id } })}
              trailing={<Text tone="soft">›</Text>}
              last={i === PARENT_GUIDES.length - 1}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
