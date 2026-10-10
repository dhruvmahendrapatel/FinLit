import { commands, JAR_KINDS, localizeLesson, relativeDayLabel } from "@finlit/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ChoreCard, GoalCard, JarCard, LevelBadge, MascotBubble, StreakChip } from "@/components/kid";
import { AdSlot } from "@/components/monetization";
import { Avatar, Button, Card, IconButton, Money, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useKidSummary, useNextLesson } from "@/hooks/use-family";
import { useToday } from "@/hooks/use-today";
import { tryCommand } from "@/lib/errors";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

export default function KidHome() {
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const next = useNextLesson(kid?.id);
  const today = useToday();
  const dispatch = useDispatch();
  const language = useFamilyState().settings.language;
  if (!kid || !summary) return null;

  const waiting = summary.pendingChores.filter((c) => c.status === "submitted");
  const inProgress = summary.pendingChores.filter((c) => c.status === "claimed");
  const nudge =
    summary.streakStatus === "at_risk"
      ? `Your ${summary.streak}-day streak ends tonight! One quick lesson keeps it alive 🔥`
      : waiting.length > 0
        ? `“${waiting[0]?.title}” is waiting for a thumbs-up from your parents ⏳`
        : summary.nextAllowanceOn
          ? `Pocket money lands ${relativeDayLabel(summary.nextAllowanceOn, today).toLowerCase()}. Pick a chore to earn extra!`
          : "Pick a chore to start earning today!";

  const claim = (choreId: string) =>
    tryCommand(() => dispatch((s, now) => commands.claimChore(s, choreId, kid.id, now))) && toast({ title: "It's yours!", body: "Mark it done when you finish", emoji: "💪" });
  const submit = (choreId: string) => router.push({ pathname: "/kid/chore/[id]", params: { id: choreId } });

  return (
    <Screen tabBarInset>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Avatar avatar={kid.avatar} size={52} ring />
          <View>
            <Text variant="h1">Hi {kid.name}!</Text>
            <Text variant="caption" tone="muted">
              Level {summary.level.level} · {summary.level.title}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <LevelBadge level={summary.level} size={48} />
          <IconButton name="people-outline" accessibilityLabel="Switch profile" onPress={() => router.replace("/who")} />
        </View>
      </View>

      <View style={{ marginTop: space.lg }}>
        <StreakChip count={summary.streak} status={summary.streakStatus} size="lg" />
      </View>

      <LinearGradient colors={["#5B4DFF", "#8B7BFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderRadius: radius.xxl, marginTop: space.lg, padding: space.xl }]}>
        <Text variant="label" color="#DCD6FF">
          My money
        </Text>
        <Money paise={summary.netWorthPaise} variant="moneyLg" color="#fff" />
        <View style={[styles.heroRow, { marginTop: space.md }]}>
          <View style={styles.heroStat}>
            <Text variant="caption" color="#DCD6FF">
              In jars
            </Text>
            <Money paise={summary.totalPaise} variant="bodyStrong" color="#fff" />
          </View>
          <View style={styles.heroStat}>
            <Text variant="caption" color="#DCD6FF">
              In goals
            </Text>
            <Money paise={summary.goalFundsPaise} variant="bodyStrong" color="#fff" />
          </View>
          <View style={styles.heroStat}>
            <Text variant="caption" color="#DCD6FF">
              Earned this week
            </Text>
            <Money paise={summary.earnedThisWeekPaise} variant="bodyStrong" color="#FFE08A" signed />
          </View>
        </View>
        <Text style={styles.heroCoin}>🪙</Text>
      </LinearGradient>

      <View style={{ marginTop: space.lg }}>
        <MascotBubble avatar={kid.avatar} message={nudge} />
      </View>

      <View style={{ marginTop: space.xxl }}>
        <SectionHeader title="My jars" emoji="🫙" actionLabel="How jars work" onAction={() => router.push({ pathname: "/kid/lesson/[id]", params: { id: "l_three_jars" } })} />
        <View style={styles.jarGrid}>
          {JAR_KINDS.map((jar) => (
            <JarCard key={jar} jar={jar} balancePaise={summary.jars[jar]} percent={summary.allowance?.allocation[jar]} onPress={() => router.push({ pathname: "/kid/jar/[jar]", params: { jar } })} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: space.xxl }}>
        <SectionHeader title="Today's chores" emoji="💪" actionLabel="See all" onAction={() => router.push("/kid/chores")} />
        <View style={{ gap: space.md }}>
          {inProgress.map((c) => (
            <ChoreCard key={c.id} chore={c} today={today} actionLabel="Mark done ✅" onAction={() => submit(c.id)} />
          ))}
          {summary.availableChores.slice(0, inProgress.length > 0 ? 1 : 2).map((c) => (
            <ChoreCard key={c.id} chore={c} today={today} actionLabel="I'll do it!" onAction={() => claim(c.id)} />
          ))}
          {inProgress.length === 0 && summary.availableChores.length === 0 ? (
            <Card tint={colors.surfaceAlt} borderColor="transparent">
              <Text variant="body" tone="muted" align="center">
                All chores done for today. Legend! 🏆
              </Text>
            </Card>
          ) : null}
        </View>
      </View>

      {next ? (
        <View style={{ marginTop: space.xxl }}>
          <SectionHeader title="Keep learning" emoji="🎓" subtitle={`${summary.lessonsCompleted} of ${summary.lessonsTotal} lessons done`} />
          <Card tint={colors.primarySoft} borderColor="transparent" onPress={() => router.push({ pathname: "/kid/lesson/[id]", params: { id: next.lesson.id } })} radius={radius.xl}>
            <View style={styles.lessonRow}>
              <Text style={{ fontSize: 40 }}>{next.lesson.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="h3">{localizeLesson(next.lesson, language).title}</Text>
                <Text variant="caption" tone="muted">
                  {next.lesson.minutes} min · +{next.lesson.xp} XP
                </Text>
              </View>
              <Button title="Start" size="sm" onPress={() => router.push({ pathname: "/kid/lesson/[id]", params: { id: next.lesson.id } })} />
            </View>
          </Card>
        </View>
      ) : null}

      {summary.activeGoals[0] ? (
        <View style={{ marginTop: space.xxl }}>
          <SectionHeader title="My goal" emoji="🎯" actionLabel="All goals" onAction={() => router.push("/kid/goals")} />
          <GoalCard goal={summary.activeGoals[0]} onPress={() => router.push({ pathname: "/kid/goal/[id]", params: { id: summary.activeGoals[0]?.id ?? "" } })} />
        </View>
      ) : null}

      <View style={{ marginTop: space.xxl }}>
        <AdSlot audience="kid" kidAgeBand={kid.ageBand} placement="kid_home" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  hero: { overflow: "hidden" },
  heroRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  heroStat: { gap: 2 },
  heroCoin: { position: "absolute", right: 14, top: 10, fontSize: 56, opacity: 0.9 },
  jarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 14 },
});
