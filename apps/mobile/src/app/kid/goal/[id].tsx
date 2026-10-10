import { commands, formatINR, goalProgress, rupees, weeksToReach } from "@finlit/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button, Card, Chip, Confetti, IconButton, Money, ProgressBar, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useKidSummary } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const AMOUNTS = [20, 50, 100, 200];

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const goal = useFamilyState().goals.find((g) => g.id === id);
  const dispatch = useDispatch();
  const [celebrate, setCelebrate] = useState(false);
  if (!goal || !kid || !summary) return null;
  const progress = goalProgress(goal);
  const saveBalance = summary.jars.save;
  const weeklySave = summary.allowance ? Math.round((summary.allowance.amountPaise * summary.allowance.allocation.save) / 100) : 0;
  const weeks = weeksToReach(goal, weeklySave);

  const contribute = (rs: number) => {
    const amount = Math.min(rupees(rs), saveBalance, progress.remainingPaise);
    if (amount <= 0) {
      toast({ title: "Nothing in the Save jar yet", body: "Finish a chore or wait for pocket money", emoji: "🐷" });
      return;
    }
    const res = tryCommand(() => {
      const out = dispatch((s, now) => commands.contributeToGoal(s, goal.id, amount, now));
      if (out.goal.status === "reached") setCelebrate(true);
      toast({
        title: `${formatINR(amount, { showPaise: false })} saved!`,
        body: out.matchPaise > 0 ? `Your parents added ${formatINR(out.matchPaise, { showPaise: false })} on top 🎁` : undefined,
        emoji: goal.emoji,
        tone: "success",
      });
    });
    void res;
  };

  return (
    <Screen>
      {celebrate ? <Confetti /> : null}
      <View style={styles.top}>
        <IconButton name="close" accessibilityLabel="Close" onPress={() => router.back()} />
        {goal.status !== "active" ? <Chip label={goal.status === "redeemed" ? "Got it!" : "Reached!"} tone="success" emoji="🎉" /> : null}
      </View>
      <View style={[styles.hero, { marginTop: space.lg }]}>
        <View style={[styles.emoji, { backgroundColor: colors.primarySoft, borderRadius: radius.xxl }]}>
          <Text style={{ fontSize: 72 }}>{goal.emoji}</Text>
        </View>
        <Text variant="title" align="center" style={{ marginTop: space.md }}>
          {goal.title}
        </Text>
        <View style={styles.amounts}>
          <Money paise={progress.fundedPaise} variant="moneyLg" tone="primary" />
          <Text variant="body" tone="muted">
            {" "}
            of {formatINR(goal.targetPaise, { showPaise: false })}
          </Text>
        </View>
        <ProgressBar percent={progress.percent} height={16} style={{ marginTop: space.md }} color={progress.reached ? colors.success : colors.primary} />
        <Text variant="caption" tone="muted" style={{ marginTop: space.sm }}>
          {progress.reached
            ? "You did it! Show this to your parents."
            : weeks !== null
              ? `${formatINR(progress.remainingPaise, { showPaise: false })} to go · about ${weeks} week${weeks === 1 ? "" : "s"} at your current saving pace`
              : `${formatINR(progress.remainingPaise, { showPaise: false })} to go`}
        </Text>
      </View>

      <View style={[styles.split, { marginTop: space.xl }]}>
        <Card style={styles.half}>
          <Text variant="label" tone="muted">
            You saved
          </Text>
          <Money paise={goal.savedPaise} variant="h2" />
        </Card>
        <Card style={styles.half} tint={colors.accentSoft} borderColor="transparent">
          <Text variant="label" color={colors.accentDark}>
            Parents added
          </Text>
          <Money paise={goal.matchedPaise} variant="h2" />
          {goal.parentMatchPercent > 0 ? (
            <Text variant="caption" tone="muted">
              {goal.parentMatchPercent}% match
            </Text>
          ) : null}
        </Card>
      </View>

      {goal.status === "active" ? (
        <Card style={{ marginTop: space.xl }}>
          <Text variant="h3">Move money from your Save jar</Text>
          <Text variant="caption" tone="muted">
            Save jar has {formatINR(saveBalance, { showPaise: false })}
          </Text>
          <View style={[styles.chips, { marginTop: space.md }]}>
            {AMOUNTS.map((a) => (
              <Button key={a} title={`₹${a}`} variant="secondary" size="sm" disabled={saveBalance < rupees(a) && saveBalance <= 0} onPress={() => contribute(a)} />
            ))}
            <Button title="All of it" size="sm" variant="custom" tint={colors.jars.save.main} tintDark={colors.jars.save.dark} disabled={saveBalance <= 0} onPress={() => contribute(saveBalance / 100)} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hero: { alignItems: "center" },
  emoji: { width: 132, height: 132, alignItems: "center", justifyContent: "center" },
  amounts: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  split: { flexDirection: "row", gap: 12 },
  half: { flex: 1, gap: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
