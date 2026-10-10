import { CHAI_SIM_ID, localizeLesson, localizeUnit, simulationProgress, TRIP_SIM_ID, type LessonProgress } from "@finlit/core";
import { useRouter } from "expo-router";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

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
  const chaiDone = kid ? simulationProgress(state, kid.id, CHAI_SIM_ID) : undefined;
  const tripDone = kid ? simulationProgress(state, kid.id, TRIP_SIM_ID) : undefined;
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
        <SectionHeader title="Simulations" emoji="🎮" subtitle="Learn by running a business and planning a trip" />
        <SimCard
          emoji="☕"
          title="Run a chai stall"
          blurb="5 days at the school mela: set your price, make the chai, beat the weather. Up to 90 XP."
          tint={colors.surfaceAlt}
          progress={chaiDone}
          isPremium={ent.isPremium}
          onPlay={() => router.push("/kid/sim/chai")}
        />
        <SimCard
          emoji="🧳"
          title="Plan a family trip"
          blurb="₹5,000, four people, two days in Lonavala. Travel, stay, food, fun... and a surprise. Up to 90 XP."
          tint={colors.infoSoft}
          progress={tripDone}
          isPremium={ent.isPremium}
          onPlay={() => router.push("/kid/sim/trip")}
          style={{ marginTop: space.md }}
        />
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

function starsFor(scorePercent: number): string {
  return scorePercent === 100 ? "⭐⭐⭐" : scorePercent >= 66 ? "⭐⭐" : "⭐";
}

function SimCard({
  emoji,
  title,
  blurb,
  tint,
  progress,
  isPremium,
  onPlay,
  style,
}: {
  emoji: string;
  title: string;
  blurb: string;
  tint: string;
  progress: LessonProgress | undefined;
  isPremium: boolean;
  onPlay: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, space, radius } = useTheme();
  return (
    <Card tint={isPremium ? tint : colors.premiumSoft} borderColor="transparent" onPress={isPremium ? onPlay : undefined} radius={radius.xl} style={style}>
      <View style={styles.premiumRow}>
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text variant="h3">{title}</Text>
          <Text variant="caption" tone="muted">
            {progress ? `Best: ${starsFor(progress.scorePercent)} · play again any time` : blurb}
          </Text>
        </View>
        {isPremium ? <Button title={progress ? "Replay" : "Play"} size="sm" onPress={onPlay} /> : <Icon name="lock-closed" size={22} color={colors.premiumDark} />}
      </View>
      {!isPremium ? (
        <Text variant="caption" color="#6B4E00" style={{ marginTop: space.sm }}>
          Simulations are part of Family Premium. Ask a parent to unlock them.
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  unitHeader: { flexDirection: "row", alignItems: "center" },
  premiumRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
