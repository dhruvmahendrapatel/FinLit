import { CHAI_SIM_ID, localizeLesson, localizeUnit, simulationProgress } from "@finlit/core";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { LessonNode, LevelBadge, StreakChip } from "@/components/kid";
import { Button, Card, Icon, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useEntitlements, useKidSummary, useLessonPath } from "@/hooks/use-family";
import { useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const OFFSETS = [0, 36, 56, 36, 0, -0];

export default function KidLearn() {
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const path = useLessonPath(kid?.id);
  const ent = useEntitlements();
  const state = useFamilyState();
  const language = state.settings.language;
  const simDone = kid ? simulationProgress(state, kid.id, CHAI_SIM_ID) : undefined;
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

      <View style={{ marginTop: space.xxl }}>
        <SectionHeader title="Simulations" emoji="🎮" subtitle="Learn by running a business" />
        <Card tint={ent.isPremium ? colors.surfaceAlt : colors.premiumSoft} borderColor="transparent" onPress={ent.isPremium ? () => router.push("/kid/sim/chai") : undefined} radius={radius.xl}>
          <View style={styles.premiumRow}>
            <Text style={{ fontSize: 40 }}>☕</Text>
            <View style={{ flex: 1 }}>
              <Text variant="h3">Run a chai stall</Text>
              <Text variant="caption" tone="muted">
                {simDone ? `Best: ${simDone.scorePercent === 100 ? "⭐⭐⭐" : simDone.scorePercent >= 66 ? "⭐⭐" : "⭐"} · play again any time` : "5 days at the school mela: set your price, make the chai, beat the weather. Up to 90 XP."}
              </Text>
            </View>
            {ent.isPremium ? <Button title={simDone ? "Replay" : "Play"} size="sm" onPress={() => router.push("/kid/sim/chai")} /> : <Icon name="lock-closed" size={22} color={colors.premiumDark} />}
          </View>
          {!ent.isPremium ? (
            <Text variant="caption" color="#6B4E00" style={{ marginTop: space.sm }}>
              Simulations are part of Family Premium. Ask a parent to unlock them.
            </Text>
          ) : null}
        </Card>
      </View>

      {path.map((unit) => (
        <View key={unit.unit.id} style={{ marginTop: space.xxl }}>
          <View style={[styles.unitHeader, { backgroundColor: unit.unit.color, borderRadius: radius.lg, padding: space.lg }]}>
            <View style={{ flex: 1 }}>
              <Text variant="label" color="rgba(255,255,255,0.8)">
                Unit {unit.unit.order} · {unit.completed}/{unit.lessons.length}
              </Text>
              <Text variant="h2" color="#fff">
                {unit.unit.emoji} {localizeUnit(unit.unit, language).title}
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
                  item={{ ...item, lesson: localizeLesson(item.lesson, language) }}
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
