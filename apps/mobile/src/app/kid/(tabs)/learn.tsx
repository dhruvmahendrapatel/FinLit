import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { LessonNode, LevelBadge, StreakChip } from "@/components/kid";
import { Card, Icon, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useEntitlements, useKidSummary, useLessonPath } from "@/hooks/use-family";
import { toast } from "@/store/toast-store";

const OFFSETS = [0, 36, 56, 36, 0, -0];

export default function KidLearn() {
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const path = useLessonPath(kid?.id);
  const ent = useEntitlements();
  if (!kid || !summary) return null;

  const nextLessonId = path.flatMap((u) => u.lessons).find((l) => l.availability.unlocked && !l.availability.completed)?.lesson.id ?? null;
  const anyPremiumLocked = path.some((u) => u.lessons.some((l) => l.availability.reason === "premium"));

  return (
    <Screen tabBarInset>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Learn</Text>
          <Text variant="body" tone="muted">
            {summary.level.title} · {summary.level.xp} XP
          </Text>
        </View>
        <LevelBadge level={summary.level} size={56} />
      </View>
      <View style={{ marginTop: space.md }}>
        <StreakChip count={summary.streak} status={summary.streakStatus} size="lg" />
      </View>

      {path.map((unit) => (
        <View key={unit.unit.id} style={{ marginTop: space.xxl }}>
          <View style={[styles.unitHeader, { backgroundColor: unit.unit.color, borderRadius: radius.lg, padding: space.lg }]}>
            <View style={{ flex: 1 }}>
              <Text variant="label" color="rgba(255,255,255,0.8)">
                Unit {unit.unit.order} · {unit.completed}/{unit.lessons.length}
              </Text>
              <Text variant="h2" color="#fff">
                {unit.unit.emoji} {unit.unit.title}
              </Text>
              <Text variant="caption" color="rgba(255,255,255,0.85)">
                {unit.unit.curriculumTag}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: space.sm }}>
            {unit.lessons.map((item, i) => {
              const isNext = item.lesson.id === nextLessonId;
              return (
                <LessonNode
                  key={item.lesson.id}
                  item={item}
                  unitColor={unit.unit.color}
                  isNext={isNext}
                  offset={Math.max(0, OFFSETS[i % OFFSETS.length] ?? 0)}
                  onPress={() => {
                    if (item.availability.reason === "premium") {
                      toast({ title: "Ask a parent to unlock this lesson", body: "It's part of Family Premium", emoji: "🔒" });
                      return;
                    }
                    if (!item.availability.unlocked) {
                      toast({ title: "Finish the lesson before this one first", emoji: "👣" });
                      return;
                    }
                    router.push({ pathname: "/kid/lesson/[id]", params: { id: item.lesson.id } });
                  }}
                />
              );
            })}
          </View>
        </View>
      ))}

      {anyPremiumLocked && !ent.isPremium ? (
        <Card tint={colors.premiumSoft} borderColor="transparent" style={{ marginTop: space.xl }}>
          <View style={styles.premiumRow}>
            <Icon name="lock-closed" size={22} color={colors.premiumDark} />
            <Text variant="caption" color="#6B4E00" style={{ flex: 1 }}>
              Lessons with a gold lock are part of Family Premium. Ask a parent to unlock them from their Chillar app. No prices or offers are shown to kids.
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  unitHeader: { flexDirection: "row", alignItems: "center" },
  premiumRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
