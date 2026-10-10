import { commands, formatINR, relativeDayLabel, rewardById } from "@finlit/core";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AdSlot, UpsellCard } from "@/components/monetization";
import { ApprovalCard, KidSummaryCard, StatTile } from "@/components/parent";
import { Button, Card, IconButton, ListRow, Money, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useFamilyOverview } from "@/hooks/use-family";
import { useToday } from "@/hooks/use-today";
import { tryCommand } from "@/lib/errors";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";
import { toast } from "@/store/toast-store";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function ParentHome() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const overview = useFamilyOverview();
  const today = useToday();
  const dispatch = useDispatch();
  const lockParent = useSessionStore((s) => s.lockParent);
  const firstName = state.parent?.name.split(" ")[0] ?? "there";

  const approve = (choreId: string) => {
    tryCommand(() => {
      const res = dispatch((s, now) => commands.approveChore(s, choreId, now));
      const kid = state.kids.find((k) => k.id === res.kidId);
      toast({ title: `Paid ${formatINR(res.paidPaise, { showPaise: false })} to ${kid?.name ?? "kid"}`, body: "Split into their jars", emoji: "🎉", tone: "success" });
    });
  };
  const reject = (choreId: string) => {
    tryCommand(() => dispatch((s, now) => commands.rejectChore(s, choreId, "Have another look and try again", now)));
    toast({ title: "Sent back", body: "They can fix it and resubmit", emoji: "🔁" });
  };
  const approveOrder = (orderId: string) => {
    tryCommand(() => dispatch((s) => commands.updateRewardOrder(s, orderId, "approved")));
    toast({ title: "Reward approved", emoji: "🎁", tone: "success" });
  };

  return (
    <Screen tabBarInset>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="muted">
            {greeting()},
          </Text>
          <Text variant="title">{firstName}</Text>
        </View>
        <IconButton name="settings-outline" accessibilityLabel="Settings" onPress={() => router.push("/parent/settings")} />
        <IconButton
          name="log-out-outline"
          accessibilityLabel="Lock parent mode"
          onPress={() => {
            lockParent();
            router.replace("/who");
          }}
        />
      </View>

      {overview.approvals.count > 0 ? (
        <View style={{ marginTop: space.xl }}>
          <SectionHeader title="Needs your thumbs-up" emoji="👍" subtitle={`${overview.approvals.count} waiting`} actionLabel="All chores" onAction={() => router.push("/parent/chores")} />
          <View style={{ gap: space.md }}>
            {overview.approvals.chores.slice(0, 3).map((c) => (
              <ApprovalCard key={c.id} chore={c} kid={state.kids.find((k) => k.id === c.claimedBy)} onApprove={() => approve(c.id)} onReject={() => reject(c.id)} />
            ))}
            {overview.approvals.rewardOrders.map((o) => {
              const reward = rewardById(o.rewardId);
              const kid = state.kids.find((k) => k.id === o.kidId);
              return (
                <Card key={o.id} tint={colors.infoSoft} borderColor="transparent">
                  <View style={styles.orderRow}>
                    <Text style={{ fontSize: 30 }}>{reward?.emoji ?? "🎁"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">
                        {kid?.name} wants “{reward?.title}”
                      </Text>
                      <Text variant="caption" tone="muted">
                        {formatINR(o.pricePaise, { showPaise: false })} already taken from their {reward?.payFromJar === "share" ? "Share" : "Spend"} jar · {reward?.fulfilledByParent ? "you fulfil this one" : reward?.partner}
                      </Text>
                    </View>
                    <Button title="Approve" size="sm" onPress={() => approveOrder(o.id)} />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="This week" emoji="📊" />
        <View style={styles.tiles}>
          <StatTile label="Family savings" emoji="🐷" value={<Money paise={overview.familySavingsPaise} variant="money" />} hint="Across all Save jars" />
          <StatTile label="Earned" emoji="💪" value={<Money paise={overview.weeklyEarnedPaise} variant="money" />} hint="Allowance + chores" />
        </View>
        <View style={[styles.tiles, { marginTop: space.md }]}>
          <StatTile label="Lessons" emoji="🎓" value={String(overview.lessonsCompletedThisWeek)} hint="Completed this week" />
          <StatTile
            label="Next payout"
            emoji="📅"
            value={overview.nextAllowance ? <Money paise={overview.nextAllowance.amountPaise} variant="money" /> : "—"}
            hint={overview.nextAllowance ? `${overview.nextAllowance.kid.name} · ${relativeDayLabel(overview.nextAllowance.on, today)}` : "No rules set"}
          />
        </View>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Kids" emoji="👧" actionLabel="Manage" onAction={() => router.push("/parent/family")} />
        <View style={{ gap: space.md }}>
          {overview.kids.map((s) => (
            <KidSummaryCard key={s.kid.id} summary={s} onPress={() => router.push({ pathname: "/parent/kid/[id]", params: { id: s.kid.id } })} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Quick actions" emoji="⚡" />
        <Card padding={space.sm}>
          <ListRow emoji="🧹" leadingColor={colors.warningSoft} title="Post a chore" subtitle="Set a reward, kids claim it" onPress={() => router.push("/parent/chore/new")} trailing={<Text tone="soft">›</Text>} />
          <ListRow emoji="🧧" leadingColor={colors.dangerSoft} title="Add shagun or a bonus" subtitle="Gifts from grandparents go straight into jars" onPress={() => overview.kids[0] && router.push({ pathname: "/parent/kid/[id]", params: { id: overview.kids[0].kid.id } })} trailing={<Text tone="soft">›</Text>} />
          <ListRow emoji="📖" leadingColor={colors.infoSoft} title="Parent guides" subtitle="How to talk about money at every age" onPress={() => router.push("/parent/learn")} trailing={<Text tone="soft">›</Text>} last />
        </Card>
      </View>

      <View style={{ marginTop: space.xl, gap: space.lg }}>
        <UpsellCard feature="advanced_insights" headline="Weekly insights on saving habits" />
        <AdSlot audience="parent" placement="parent_home" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  tiles: { flexDirection: "row", gap: 12 },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
