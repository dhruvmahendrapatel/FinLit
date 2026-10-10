import { commands, paywallFeatures, PLANS, type BillingOffering, type PlanId } from "@finlit/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { PremiumBadge } from "@/components/monetization";
import { Button, Card, Chip, Confetti, Icon, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useEntitlements } from "@/hooks/use-family";
import { haptic } from "@/lib/haptics";
import { billing } from "@/store/billing";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

/**
 * Paywall. Shown only on parent screens (DPDP: offers never reach kids).
 * Prices come from the billing provider so store pricing can differ by region.
 */
export default function Premium() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const ent = useEntitlements();
  const dispatch = useDispatch();
  const [offering, setOffering] = useState<BillingOffering | null>(null);
  const [selected, setSelected] = useState<PlanId>("premium_yearly");
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    let alive = true;
    void billing.configure(state.family?.id ?? "anonymous").then(() => billing.getOfferings()).then((o) => {
      if (alive) {
        setOffering(o);
        setSelected(o.defaultPackageId);
      }
    });
    return () => {
      alive = false;
    };
  }, [state.family?.id]);

  const purchase = async () => {
    setBusy("purchase");
    const result = await billing.purchase(selected);
    setBusy(null);
    if (result.status === "success") {
      dispatch((s) => commands.applyCustomerInfo(s, result.customerInfo));
      haptic.success();
      setCelebrate(true);
      toast({ title: "Welcome to Family Premium!", body: "Ads are gone and every lesson is unlocked", emoji: "✨", tone: "premium" });
    } else if (result.status === "error") {
      toast({ title: "Payment didn't go through", body: result.message, emoji: "😕", tone: "danger" });
    }
  };

  const restore = async () => {
    setBusy("restore");
    const info = await billing.restorePurchases();
    setBusy(null);
    dispatch((s) => commands.applyCustomerInfo(s, info));
    toast({ title: info.activePlan === "free" ? "No purchases to restore" : "Purchases restored", emoji: info.activePlan === "free" ? "🔎" : "✅" });
  };

  const pkg = offering?.packages.find((p) => p.id === selected);
  const plan = PLANS[selected];

  return (
    <Screen padded={false} edges={["left", "right"]}>
      {celebrate ? <Confetti /> : null}
      <LinearGradient colors={["#2E2496", "#5B4DFF"]} style={[styles.hero, { padding: space.xl, paddingTop: space.huge }]}>
        <View style={styles.heroTop}>
          <PremiumBadge label="Family Premium" size="md" />
          <IconButton name="close" accessibilityLabel="Close" bg="rgba(255,255,255,0.15)" color="#fff" onPress={() => (router.canGoBack() ? router.back() : router.replace("/parent"))} />
        </View>
        <Text variant="display" color="#fff" style={{ marginTop: space.lg }}>
          {ent.isPremium ? "You're all set ✨" : "Everything your family needs to get money-smart"}
        </Text>
        <Text variant="body" color="#DCD6FF" style={{ marginTop: space.sm }}>
          {ent.isPremium ? "Thanks for supporting Chillar. Here is what your family gets." : "One plan for every kid. Cancel anytime from your app store."}
        </Text>
      </LinearGradient>

      <View style={{ padding: space.lg, gap: space.lg }}>
        <Card>
          {paywallFeatures().map((f, i) => (
            <Animated.View key={f.feature} entering={FadeInUp.delay(i * 40)} style={[styles.feature, i > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}>
              <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.featureTitle}>
                  <Text variant="bodyStrong">{f.title}</Text>
                  {f.status === "coming_soon" ? <Chip label="Coming soon" size="sm" tone="neutral" /> : null}
                </View>
                <Text variant="caption" tone="muted">
                  {f.description}
                </Text>
              </View>
              <Icon name={f.status === "coming_soon" ? "time-outline" : "checkmark-circle"} size={22} color={f.status === "coming_soon" ? colors.textSoft : colors.success} />
            </Animated.View>
          ))}
        </Card>

        {ent.isPremium ? (
          <Card tint={colors.premiumSoft} borderColor="transparent">
            <Text variant="h3">{PLANS[state.planId].name} · {PLANS[state.planId].period === "year" ? "Yearly" : "Monthly"}</Text>
            <Text variant="caption" tone="muted">
              {state.billing?.expiresAt ? `Renews ${new Date(state.billing.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : "Active"} · Manage or cancel in your app store subscriptions.
            </Text>
          </Card>
        ) : (
          <>
            <View style={{ gap: space.md }}>
              {(offering?.packages ?? []).map((p) => {
                const on = selected === p.id;
                return (
                  <Pressable key={p.id} onPress={() => { haptic.tap(); setSelected(p.id); }} style={[styles.plan, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.surface, borderRadius: radius.xl }]}>
                    <View style={[styles.radio, { borderColor: on ? colors.primary : colors.borderStrong, backgroundColor: on ? colors.primary : "transparent" }]}>{on ? <Icon name="checkmark" size={14} color="#fff" /> : null}</View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.planTitle}>
                        <Text variant="h3">{p.plan.period === "year" ? "Yearly" : "Monthly"}</Text>
                        {p.plan.badge ? <Chip label={p.plan.badge} tone="premium" size="sm" /> : null}
                        {p.plan.savingsLabel ? <Chip label={p.plan.savingsLabel} tone="success" size="sm" /> : null}
                      </View>
                      <Text variant="caption" tone="muted">
                        {p.plan.trialDays > 0 ? `${p.plan.trialDays}-day free trial, then ` : ""}
                        {p.priceString}
                        {p.plan.period === "year" ? ` (${p.perMonthString})` : ""}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: fontFamily.black, fontSize: 20, color: colors.text }}>{p.priceString.split("/")[0]}</Text>
                  </Pressable>
                );
              })}
              {!offering ? (
                <Card>
                  <Text variant="caption" tone="muted" align="center">
                    Loading plans…
                  </Text>
                </Card>
              ) : null}
            </View>

            <Button
              title={plan.trialDays > 0 ? `Start ${plan.trialDays}-day free trial` : `Subscribe · ${pkg?.priceString ?? ""}`}
              variant="premium"
              size="lg"
              full
              loading={busy === "purchase"}
              disabled={!offering}
              onPress={() => void purchase()}
            />
            <Button title="Restore purchases" variant="ghost" size="sm" full loading={busy === "restore"} onPress={() => void restore()} />
            <Text variant="caption" tone="soft" align="center">
              Billed through the App Store or Google Play. Recurring, cancel anytime. Free families keep all core features: jars, chores, goals and the first lessons of every unit. Features marked “coming soon” are included when they launch.
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  feature: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  featureTitle: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  plan: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 2 },
  planTitle: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
