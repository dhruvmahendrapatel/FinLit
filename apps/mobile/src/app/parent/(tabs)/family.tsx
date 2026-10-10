import { AGE_BANDS, PLANS } from "@finlit/core";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { PremiumBadge } from "@/components/monetization";
import { Avatar, Button, Card, Icon, ListRow, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useEntitlements } from "@/hooks/use-family";
import { useFamilyState } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";

export default function ParentFamily() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const ent = useEntitlements();
  const lockParent = useSessionStore((s) => s.lockParent);
  const plan = PLANS[state.planId];

  return (
    <Screen tabBarInset>
      <Text variant="title">{state.family?.name ?? "Family"}</Text>
      <Text variant="body" tone="muted">
        {state.family?.city} · {state.kids.length} kid{state.kids.length === 1 ? "" : "s"}
      </Text>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Kids" emoji="👧" actionLabel={state.kids.length < ent.maxKids ? "Add a kid" : undefined} onAction={() => router.push("/parent/add-kid")} />
        <Card padding={space.sm}>
          {state.kids.map((k, i) => (
            <ListRow
              key={k.id}
              leading={<Avatar avatar={k.avatar} size={44} />}
              title={k.name}
              subtitle={`Age ${k.age} · ${AGE_BANDS[k.ageBand].label} · ${k.xp} XP`}
              onPress={() => router.push({ pathname: "/parent/kid/[id]", params: { id: k.id } })}
              trailing={<Icon name="chevron-forward" size={18} color={colors.textSoft} />}
              last={i === state.kids.length - 1}
            />
          ))}
        </Card>
        {state.kids.length >= ent.maxKids && !ent.isPremium ? (
          <Text variant="caption" tone="muted" style={{ marginTop: space.sm }}>
            Free covers 2 kids. Family Premium covers everyone.
          </Text>
        ) : null}
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Plan" emoji="💎" />
        <Card tint={ent.isPremium ? colors.premiumSoft : undefined} borderColor={ent.isPremium ? "transparent" : undefined} onPress={() => router.push("/parent/premium")}>
          <View style={styles.planRow}>
            <View style={{ flex: 1, gap: 4 }}>
              {ent.isPremium ? <PremiumBadge label="Family Premium" /> : <Text variant="label" tone="muted">Current plan</Text>}
              <Text variant="h3">{ent.isPremium ? `${plan.name} · ${plan.period === "year" ? "Yearly" : "Monthly"}` : "Chillar Free"}</Text>
              <Text variant="caption" tone="muted">
                {ent.isPremium
                  ? state.billing?.expiresAt
                    ? `Renews ${new Date(state.billing.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Active"
                  : "2 kids · first lessons of every unit · contextual ads"}
              </Text>
            </View>
            <Button title={ent.isPremium ? "Manage" : "Upgrade"} size="sm" variant={ent.isPremium ? "surface" : "premium"} onPress={() => router.push("/parent/premium")} />
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Account" emoji="🔐" />
        <Card padding={space.sm}>
          <ListRow emoji="🧑" leadingColor={colors.primarySoft} title={state.parent?.name ?? "Parent"} subtitle={state.parent?.phoneMasked} onPress={() => router.push("/parent/settings")} trailing={<Icon name="chevron-forward" size={18} color={colors.textSoft} />} />
          <ListRow emoji="🛡️" leadingColor={colors.successSoft} title="Privacy & consent" subtitle={`DPDP notice v${state.consent?.version ?? "—"} · export or delete any time`} onPress={() => router.push("/parent/settings")} trailing={<Icon name="chevron-forward" size={18} color={colors.textSoft} />} />
          <ListRow emoji="☁️" leadingColor={colors.infoSoft} title="Cloud sync & kid devices" subtitle="Same family on every phone" onPress={() => router.push("/parent/sync")} trailing={<Icon name="chevron-forward" size={18} color={colors.textSoft} />} />
          <ListRow emoji="⚙️" leadingColor={colors.bgAlt} title="Settings" subtitle="PIN, kid-mode time limit, reminders, language" onPress={() => router.push("/parent/settings")} trailing={<Icon name="chevron-forward" size={18} color={colors.textSoft} />} last />
        </Card>
      </View>

      <View style={{ marginTop: space.xl, gap: space.sm }}>
        <Button
          title="Lock parent mode"
          variant="surface"
          full
          icon={<Icon name="lock-closed" size={18} />}
          onPress={() => {
            lockParent();
            router.replace("/who");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  planRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
