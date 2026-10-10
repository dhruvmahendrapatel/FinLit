import { StyleSheet, View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { useTheme } from "@/design";

export function PremiumBadge({ label = "Premium", size = "sm" }: { label?: string; size?: "sm" | "md" }) {
  const { colors, radius, fontFamily } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.premium, borderRadius: radius.pill, paddingVertical: size === "sm" ? 3 : 6, paddingHorizontal: size === "sm" ? 8 : 12 }]}>
      <Icon name="sparkles" size={size === "sm" ? 12 : 16} color="#3A2A00" />
      <Text style={{ fontFamily: fontFamily.black, fontSize: size === "sm" ? 11 : 13, color: "#3A2A00", letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" } });
