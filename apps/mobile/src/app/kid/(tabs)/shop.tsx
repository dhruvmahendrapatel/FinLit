import { commands, REWARDS, type Reward, type RewardCategory } from "@finlit/core";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button, Card, Chip, Icon, Money, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useEntitlements, useKidSummary } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { useDispatch } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const CATEGORIES: { id: RewardCategory | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "family", label: "Family", emoji: "🏠" },
  { id: "treats", label: "Treats", emoji: "🍨" },
  { id: "books", label: "Books", emoji: "📚" },
  { id: "learning", label: "Learning", emoji: "🔬" },
  { id: "experiences", label: "Days out", emoji: "🎟️" },
];

export default function KidShop() {
  const { colors, space, radius } = useTheme();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const ent = useEntitlements();
  const dispatch = useDispatch();
  const [cat, setCat] = useState<RewardCategory | "all">("all");
  if (!kid || !summary) return null;

  const items = REWARDS.filter((r) => cat === "all" || r.category === cat);

  const buy = (reward: Reward) => {
    const ok = tryCommand(() => dispatch((s, now) => commands.requestReward(s, kid.id, reward.id, now)), {
      onPremiumRequired: () => toast({ title: "Ask a parent to unlock this reward", body: "It's a Family Premium exclusive", emoji: "🔒" }),
    });
    if (ok) toast({ title: `${reward.title} requested!`, body: reward.fulfilledByParent ? "Your parents will make it happen" : `${reward.partner} will deliver once approved`, emoji: reward.emoji, tone: "success" });
  };

  return (
    <Screen tabBarInset>
      <Text variant="title">Reward shop</Text>
      <Text variant="body" tone="muted">
        Spend what you earned on things you love
      </Text>

      <Card tint={colors.jars.spend.soft} borderColor="transparent" style={{ marginTop: space.lg }}>
        <View style={styles.balanceRow}>
          <Text style={{ fontSize: 30 }}>🍦</Text>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.jars.spend.dark}>
              Spend jar
            </Text>
            <Money paise={summary.jars.spend} variant="money" />
          </View>
          <View>
            <Text variant="caption" color={colors.jars.share.dark}>
              Share jar
            </Text>
            <Money paise={summary.jars.share} variant="h3" />
          </View>
        </View>
      </Card>

      <View style={[styles.cats, { marginTop: space.lg }]}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} emoji={c.emoji} selected={cat === c.id} onPress={() => setCat(c.id)} />
        ))}
      </View>

      <View style={[styles.grid, { marginTop: space.lg }]}>
        {items.map((r) => {
          const jar = r.payFromJar ?? "spend";
          const affordable = summary.jars[jar] >= r.pricePaise;
          const locked = r.premiumOnly && !ent.isPremium;
          return (
            <Card key={r.id} padding={space.md} radius={radius.xl} style={styles.item}>
              <View style={[styles.itemEmoji, { backgroundColor: locked ? colors.premiumSoft : colors.bgAlt, borderRadius: radius.lg }]}>
                <Text style={{ fontSize: 40 }}>{r.emoji}</Text>
                {locked ? (
                  <View style={[styles.lock, { backgroundColor: colors.premium }]}>
                    <Icon name="lock-closed" size={12} color="#3A2A00" />
                  </View>
                ) : null}
              </View>
              <Text variant="bodyStrong" numberOfLines={2} style={{ marginTop: space.sm, minHeight: 44 }}>
                {r.title}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={2}>
                {r.fulfilledByParent ? "From your parents" : r.partner}
              </Text>
              <View style={[styles.priceRow, { marginTop: space.sm }]}>
                <Money paise={r.pricePaise} variant="h3" color={colors.jars[jar].dark} />
                {jar === "share" ? <Text style={{ fontSize: 14 }}>💝</Text> : null}
              </View>
              <Button title={locked ? "Ask a parent" : affordable ? "Get it" : "Keep saving"} size="sm" full variant={locked ? "surface" : affordable ? "primary" : "surface"} disabled={!locked && !affordable} onPress={() => buy(r)} style={{ marginTop: space.sm }} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  item: { width: "47%", flexGrow: 1 },
  itemEmoji: { height: 84, alignItems: "center", justifyContent: "center" },
  lock: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
});
