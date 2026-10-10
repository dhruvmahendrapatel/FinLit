import { FEATURE_INFO, type Feature } from "@finlit/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { PremiumBadge } from "./PremiumBadge";
import { Icon, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useEntitlements } from "@/hooks/use-family";

export interface UpsellCardProps {
  feature: Feature;
  /** Optional contextual headline, e.g. "Unlock Compounding: money's snowball" */
  headline?: string;
  compact?: boolean;
}

/** Gold gradient upsell for a locked feature. Hidden automatically for premium families. */
export function UpsellCard({ feature, headline, compact = false }: UpsellCardProps) {
  const { radius, space } = useTheme();
  const router = useRouter();
  const ent = useEntitlements();
  if (ent.isPremium) return null;
  const info = FEATURE_INFO[feature];
  return (
    <Pressable onPress={() => router.push("/parent/premium")} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient colors={["#FFE08A", "#FFC233", "#FFB020"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderRadius: radius.xl, padding: compact ? space.md : space.lg }]}>
        <View style={styles.row}>
          <Text style={{ fontSize: compact ? 28 : 36 }}>{info.emoji}</Text>
          <View style={styles.text}>
            <PremiumBadge label="Family Premium" />
            <Text variant={compact ? "bodyStrong" : "h3"} color="#3A2A00" style={{ marginTop: 6 }}>
              {headline ?? info.title}
            </Text>
            <Text variant="caption" color="#6B4E00">
              {info.description} · from ₹83/month{info.status === "coming_soon" ? " · coming soon" : ""}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#3A2A00" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
