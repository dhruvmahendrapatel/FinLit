import { goalsForKid } from "@finlit/core";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { GoalCard } from "@/components/kid";
import { Button, Card, EmptyState, Money, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useKidSummary } from "@/hooks/use-family";
import { useFamilyState } from "@/store/family-store";

export default function KidGoals() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const state = useFamilyState();
  const goals = useMemo(() => (kid ? goalsForKid(state, kid.id) : []), [state, kid]);
  if (!kid || !summary) return null;
  const active = goals.filter((g) => g.status === "active");
  const finished = goals.filter((g) => g.status !== "active");

  return (
    <Screen tabBarInset>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="title">Goals</Text>
          <Text variant="body" tone="muted">
            Save for something big
          </Text>
        </View>
        <Button title="New goal" size="sm" icon={<Text style={{ color: "#fff", fontSize: 16 }}>＋</Text>} onPress={() => router.push("/kid/goal/new")} />
      </View>

      <Card tint={colors.jars.save.soft} borderColor="transparent" style={{ marginTop: space.lg }}>
        <View style={styles.saveRow}>
          <Text style={{ fontSize: 32 }}>🐷</Text>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.jars.save.dark}>
              In your Save jar, ready to move
            </Text>
            <Money paise={summary.jars.save} variant="money" />
          </View>
        </View>
      </Card>

      <View style={{ gap: space.md, marginTop: space.xl }}>
        {active.map((g) => (
          <GoalCard key={g.id} goal={g} onPress={() => router.push({ pathname: "/kid/goal/[id]", params: { id: g.id } })} />
        ))}
        {active.length === 0 ? <EmptyState emoji="🎯" title="No goals yet" body="A cricket bat? A cycle? Pick something and watch the bar fill up." actionLabel="Make a goal" onAction={() => router.push("/kid/goal/new")} /> : null}
      </View>

      {finished.length > 0 ? (
        <View style={{ marginTop: space.xxl, gap: space.md }}>
          <Text variant="h2">Reached 🎉</Text>
          {finished.map((g) => (
            <GoalCard key={g.id} goal={g} showKidMatch={false} onPress={() => router.push({ pathname: "/kid/goal/[id]", params: { id: g.id } })} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  saveRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
