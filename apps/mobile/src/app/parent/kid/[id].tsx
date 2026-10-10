import { AGE_BANDS, commands, describeCadence, formatINR, goalProgress, JAR_KINDS, rupees, type AllowanceCadence, type Weekday } from "@finlit/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { GoalCard, JarCard } from "@/components/kid";
import { Avatar, Button, Card, Chip, EmptyState, IconButton, ListRow, Money, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useKidSummary } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const GIFTS = [51, 101, 251, 501];
const SPENDS = [20, 50, 100];
const ALLOWANCES = [50, 100, 150, 200, 300, 500];
const RATES = [6, 12, 18, 24];
const MATCHES = [0, 25, 50, 100];
const DAYS: { d: Weekday; l: string }[] = [
  { d: 0, l: "Sun" },
  { d: 1, l: "Mon" },
  { d: 5, l: "Fri" },
  { d: 6, l: "Sat" },
];

export default function ParentKidDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, space } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const summary = useKidSummary(id);
  const dispatch = useDispatch();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const activity = useMemo(() => (id ? state.ledger.filter((e) => e.kidId === id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8) : []), [state.ledger, id]);
  if (!summary) return null;
  const { kid, allowance, interestRule } = summary;
  const goals = state.goals.filter((g) => g.kidId === kid.id && g.status !== "redeemed");

  const gift = (rs: number) =>
    tryCommand(() => dispatch((s, now) => commands.giftMoney(s, { kidId: kid.id, amountPaise: rupees(rs), from: "Nani" }, now))) &&
    toast({ title: `₹${rs} shagun added for ${kid.name}`, body: "Split into their jars", emoji: "🧧", tone: "success" });
  const spend = (rs: number) =>
    tryCommand(() => dispatch((s, now) => commands.spendFromJar(s, { kidId: kid.id, jar: "spend", amountPaise: rupees(rs), memo: "Cash handed over" }, now))) &&
    toast({ title: `₹${rs} recorded from the Spend jar`, emoji: "🛍️" });
  const setAllowance = (patch: { amountPaise?: number; cadence?: AllowanceCadence; weekday?: Weekday; active?: boolean }) =>
    tryCommand(() =>
      dispatch((s) =>
        commands.upsertAllowanceRule(s, {
          kidId: kid.id,
          amountPaise: patch.amountPaise ?? allowance?.amountPaise ?? rupees(100),
          cadence: patch.cadence ?? allowance?.cadence ?? "weekly",
          weekday: patch.weekday ?? allowance?.weekday ?? 0,
          dayOfMonth: allowance?.dayOfMonth ?? 1,
          allocation: allowance?.allocation ?? { spend: 40, save: 40, share: 10, invest: 10 },
          active: patch.active ?? allowance?.active ?? true,
          ...(allowance?.lastPaidOn ? { lastPaidOn: allowance.lastPaidOn } : {}),
        }),
      ),
    );
  const setInterest = (patch: { annualRatePercent?: number; active?: boolean }) =>
    tryCommand(() =>
      dispatch((s) =>
        commands.upsertInterestRule(s, {
          kidId: kid.id,
          annualRatePercent: patch.annualRatePercent ?? interestRule?.annualRatePercent ?? 12,
          active: patch.active ?? interestRule?.active ?? true,
          ...(interestRule?.lastAccruedMonth ? { lastAccruedMonth: interestRule.lastAccruedMonth } : {}),
        }),
      ),
    );

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton name="chevron-back" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/parent"))} />
      </View>
      <View style={[styles.hero, { marginTop: space.md }]}>
        <Avatar avatar={kid.avatar} size={84} ring />
        <View style={{ flex: 1 }}>
          <Text variant="title">{kid.name}</Text>
          <Text variant="caption" tone="muted">
            Age {kid.age} · {AGE_BANDS[kid.ageBand].label} · Level {summary.level.level} {summary.level.title}
          </Text>
          <View style={styles.amounts}>
            <Money paise={summary.netWorthPaise} variant="money" />
            <Text variant="caption" tone="muted">
              {" "}
              net worth
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.jarGrid, { marginTop: space.xl }]}>
        {JAR_KINDS.map((jar) => (
          <JarCard key={jar} jar={jar} balancePaise={summary.jars[jar]} percent={allowance?.allocation[jar]} compact />
        ))}
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Add or record money" emoji="💸" />
        <Card>
          <Text variant="bodyStrong">Shagun or bonus</Text>
          <Text variant="caption" tone="muted">
            Gifts from relatives, split into jars by {kid.name}’s allocation
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {GIFTS.map((g) => (
              <Button key={g} title={`₹${g}`} size="sm" variant="secondary" onPress={() => gift(g)} />
            ))}
          </View>
          <Text variant="bodyStrong" style={{ marginTop: space.lg }}>
            Hand over cash from the Spend jar
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {SPENDS.map((g) => (
              <Button key={g} title={`₹${g}`} size="sm" variant="surface" disabled={summary.jars.spend < rupees(g)} onPress={() => spend(g)} />
            ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Pocket money" emoji="📅" subtitle={allowance ? `${formatINR(allowance.amountPaise, { showPaise: false })} · ${describeCadence(allowance)}` : "Not set up yet"} />
        <Card>
          <View style={styles.switchRow}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              Pay automatically
            </Text>
            <Switch value={allowance?.active ?? false} onValueChange={(v) => {
              setAllowance({ active: v });
            }} trackColor={{ true: colors.primary, false: colors.borderStrong }} thumbColor="#fff" />
          </View>
          <Text variant="label" tone="muted" style={{ marginTop: space.md }}>
            Amount
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {ALLOWANCES.map((a) => (
              <Chip key={a} label={`₹${a}`} selected={allowance?.amountPaise === rupees(a)} onPress={() => setAllowance({ amountPaise: rupees(a) })} />
            ))}
          </View>
          <Text variant="label" tone="muted" style={{ marginTop: space.md }}>
            Day
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {DAYS.map((d) => (
              <Chip key={d.d} label={d.l} selected={allowance?.cadence === "weekly" && allowance.weekday === d.d} onPress={() => setAllowance({ cadence: "weekly", weekday: d.d })} />
            ))}
            <Chip label="1st of month" selected={allowance?.cadence === "monthly"} onPress={() => setAllowance({ cadence: "monthly" })} />
          </View>
          <Text variant="caption" tone="soft" style={{ marginTop: space.md }}>
            Split: {allowance ? JAR_KINDS.map((j) => `${allowance.allocation[j]}% ${j}`).join(" · ") : "40% spend · 40% save · 10% share · 10% grow"}
          </Text>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Bank of Mum & Dad" emoji="🏦" subtitle="Monthly interest on the Save jar" />
        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Pay interest</Text>
              <Text variant="caption" tone="muted">
                {interestRule?.active ? `Costs you about ${formatINR(Math.round((summary.jars.save * (interestRule.annualRatePercent / 100)) / 12), { showPaise: false })} this month` : "Off"}
              </Text>
            </View>
            <Switch value={interestRule?.active ?? false} onValueChange={(v) => {
              setInterest({ active: v });
            }} trackColor={{ true: colors.primary, false: colors.borderStrong }} thumbColor="#fff" />
          </View>
          <View style={[styles.wrap, { marginTop: space.md }]}>
            {RATES.map((r) => (
              <Chip key={r} label={`${r}% a year`} selected={interestRule?.annualRatePercent === r} onPress={() => setInterest({ annualRatePercent: r, active: true })} />
            ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Goals" emoji="🎯" subtitle="Set how much you match on every rupee saved" />
        <View style={{ gap: space.md }}>
          {goals.length === 0 ? <EmptyState emoji="🎯" title="No goals yet" body={`${kid.name} can create one in their app`} /> : null}
          {goals.map((g) => (
            <View key={g.id} style={{ gap: space.sm }}>
              <GoalCard goal={g} showKidMatch={false} />
              <View style={styles.wrap}>
                <Text variant="caption" tone="muted" style={{ alignSelf: "center" }}>
                  Match:
                </Text>
                {MATCHES.map((m) => (
                  <Chip key={m} label={`${m}%`} size="sm" selected={g.parentMatchPercent === m} onPress={() => tryCommand(() => dispatch((s) => commands.updateGoalMatch(s, g.id, m)))} />
                ))}
                {g.status === "reached" ? (
                  <Button
                    title="Bought it 🎉"
                    size="sm"
                    variant="accent"
                    onPress={() => tryCommand(() => dispatch((s, now) => commands.redeemGoal(s, g.id, now))) && toast({ title: `${kid.name} reached ${g.title}!`, emoji: g.emoji, tone: "success" })}
                  />
                ) : (
                  <Text variant="caption" tone="soft" style={{ alignSelf: "center" }}>
                    {formatINR(goalProgress(g).remainingPaise, { showPaise: false })} to go
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Recent activity" emoji="🧾" />
        <Card padding={space.sm}>
          {activity.length === 0 ? <EmptyState emoji="🫙" title="No activity yet" /> : null}
          {activity.map((e, i) => (
            <ListRow
              key={e.id}
              emoji={e.emoji ?? "•"}
              leadingColor={e.amountPaise > 0 ? colors.successSoft : colors.dangerSoft}
              title={e.memo}
              subtitle={`${new Date(e.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${e.jar} jar`}
              trailing={<Money paise={e.amountPaise} variant="bodyStrong" signed tone={e.amountPaise > 0 ? "success" : "default"} />}
              last={i === activity.length - 1}
            />
          ))}
        </Card>
      </View>

      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        {confirmRemove ? (
          <Card tint={colors.dangerSoft} borderColor="transparent">
            <Text variant="bodyStrong" tone="danger">
              Remove {kid.name} and delete all their data?
            </Text>
            <Text variant="caption" tone="muted">
              This cannot be undone. Export first from Settings if you want a copy.
            </Text>
            <View style={[styles.wrap, { marginTop: space.md }]}>
              <Button title="Cancel" size="sm" variant="surface" onPress={() => setConfirmRemove(false)} />
              <Button
                title="Yes, remove"
                size="sm"
                variant="danger"
                onPress={() => {
                  tryCommand(() => dispatch((s) => commands.removeKid(s, kid.id)));
                  router.replace("/parent/family");
                }}
              />
            </View>
          </Card>
        ) : (
          <Button title={`Remove ${kid.name}`} variant="ghost" size="sm" onPress={() => setConfirmRemove(true)} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row" },
  hero: { flexDirection: "row", alignItems: "center", gap: 16 },
  amounts: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  jarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
