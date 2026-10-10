import { JAR_INFO, type JarKind, type Paise } from "@finlit/core";
import { StyleSheet, View } from "react-native";

import { Card, Money, Text } from "@/components/ui";
import { useTheme } from "@/design";

export interface JarCardProps {
  jar: JarKind;
  balancePaise: Paise;
  percent?: number;
  onPress?: () => void;
  compact?: boolean;
}

/** One of the four jars, drawn as a chunky tinted tile. */
export function JarCard({ jar, balancePaise, percent, onPress, compact = false }: JarCardProps) {
  const { colors, radius } = useTheme();
  const palette = colors.jars[jar];
  const info = JAR_INFO[jar];
  return (
    <Card tint={palette.soft} borderColor="transparent" onPress={onPress} padding={compact ? 12 : 16} radius={radius.xl} style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.emojiWrap, { backgroundColor: palette.main, width: compact ? 36 : 44, height: compact ? 36 : 44, borderRadius: compact ? 12 : 14 }]}>
          <Text style={{ fontSize: compact ? 18 : 22 }}>{info.emoji}</Text>
        </View>
        {percent !== undefined ? (
          <Text variant="captionStrong" color={palette.dark}>
            {percent}%
          </Text>
        ) : null}
      </View>
      <Text variant="captionStrong" color={palette.dark} style={{ marginTop: compact ? 8 : 12 }}>
        {info.label}
      </Text>
      <Money paise={balancePaise} variant={compact ? "h3" : "money"} color={colors.text} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  emojiWrap: { alignItems: "center", justifyContent: "center" },
});
