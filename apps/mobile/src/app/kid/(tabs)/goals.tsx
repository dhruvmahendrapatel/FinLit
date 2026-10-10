import { commands, goalsForKid, rupees } from "@finlit/core";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { GoalCard } from "@/components/kid";
import { LoanCard } from "@/components/kid/LoanCard";
import { Button, Card, EmptyState, Icon, Money, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useEntitlements, useKidSummary } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

export default function KidGoals() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const state = useFamilyState();
  const goals = useMemo(() => (kid ? goalsForKid(state, kid.id) : []), [state, kid]);
  const ent = useEntitlements();
  const dispatch = useDispatch();
  if (!kid || !summary) return null;
  const loan = summary.activeLoan;
  const payEarly = (rs: number) => {
    if (!loan) return;
    const ok = tryCommand(() => {
      const res = dispatch((s, now) => commands.repayLoan(s, loan.id, rupees(rs), now));
      toast({ title: `Paid ₹${Math.round(res.paidPaise / 100)} towards your loan`, body: res.loan.status === "repaid" ? "All paid off. Legend! 🎉" : undefined, emoji: "🧾", tone: "success" });
    });
    void ok;
  };
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

      <View style={{ marginTop: space.xxl }}>
        <SectionHeader title="Need it sooner?" emoji="🧾" subtitle="Borrow from Mum & Dad and pay back in EMIs" />
        {loan ? (
          <LoanCard loan={loan}>
            {loan.status === "active" ? (
              <View style={styles.wrap}>
                <Text variant="caption" tone="muted" style={{ alignSelf: "center" }}>
                  Pay early:
                </Text>
                {[50, 100, 200].map((a) => (
                  <Button key={a} title={`₹${a}`} size="sm" variant="secondary" disabled={summary.jars.spend < rupees(Math.min(a, 1))} onPress={() => payEarly(a)} />
                ))}
              </View>
            ) : null}
          </LoanCard>
        ) : ent.features.has("family_loans") ? (
          <Card tint={colors.warningSoft} borderColor="transparent">
            <View style={styles.loanRow}>
              <Text style={{ fontSize: 32 }}>🏦</Text>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Family loan</Text>
                <Text variant="caption" tone="muted">
                  Ask for up to ₹5,000 and repay from pocket money. Borrowing costs extra, so think first.
                </Text>
              </View>
            </View>
            <Button title="Borrow for it" size="sm" variant="accent" onPress={() => router.push("/kid/loan/new")} style={{ marginTop: space.md }} />
          </Card>
        ) : (
          <Card tint={colors.premiumSoft} borderColor="transparent">
            <View style={styles.loanRow}>
              <Icon name="lock-closed" size={22} color={colors.premiumDark} />
              <Text variant="caption" color="#6B4E00" style={{ flex: 1 }}>
                Family loans are part of Family Premium. Ask a parent to unlock them.
              </Text>
            </View>
          </Card>
        )}
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
  loanRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
