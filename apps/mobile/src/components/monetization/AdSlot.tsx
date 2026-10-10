import { adPolicy, type AgeBand, type Audience } from "@finlit/core";
import { StyleSheet, View } from "react-native";

import { Button, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useFamilyState } from "@/store/family-store";
import { useRouter } from "expo-router";

export interface AdSlotProps {
  audience: Audience;
  kidAgeBand?: AgeBand;
  inLesson?: boolean;
  /** Where the slot sits, for reporting */
  placement: string;
}

/**
 * Placeholder for a contextual / consented ad. Encodes the DPDP policy from core:
 * the slot renders nothing for premium families and never personalises for kids.
 * Replace the inner view with the ad SDK (Google Play Families-certified on kid screens).
 */
export function AdSlot({ audience, kidAgeBand, inLesson, placement }: AdSlotProps) {
  const { colors, radius, space } = useTheme();
  const state = useFamilyState();
  const router = useRouter();
  const policy = adPolicy({
    audience,
    planId: state.planId,
    parentAdConsent: state.settings.parentAdConsent,
    ...(kidAgeBand ? { kidAgeBand } : {}),
    ...(inLesson !== undefined ? { inLesson } : {}),
  });
  if (!policy.show) return null;
  const kid = audience === "kid";
  return (
    <View
      testID={`ad-slot-${placement}`}
      style={[styles.slot, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: radius.lg, padding: space.md }]}
    >
      <View style={styles.header}>
        <Text variant="label" tone="soft">
          {kid ? "Sponsored story" : "Sponsored"} · {policy.mode === "contextual" ? "contextual" : "personalised"}
        </Text>
      </View>
      <Text variant="bodyStrong">{kid ? "📚 Tinkle Digest: 3 months for ₹299" : "🏦 Open a kids' savings account in 5 minutes"}</Text>
      <Text variant="caption" tone="muted">
        {kid ? "Comics that make reading a habit." : "Partner bank · 10+ can own an account (RBI, 2025)"}
      </Text>
      {!kid ? (
        <View style={styles.footer}>
          <Button title="Remove ads with Premium" variant="ghost" size="sm" onPress={() => router.push("/parent/premium")} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { borderWidth: 1, gap: 4 },
  header: { flexDirection: "row", justifyContent: "space-between" },
  footer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 2 },
});
