import { JAR_INFO, entriesForKid, formatINR, projectGrowth, rupees, type JarKind } from "@finlit/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Card, Chip, EmptyState, IconButton, ListRow, Money, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useKidSummary } from "@/hooks/use-family";
import { useFamilyState } from "@/store/family-store";

const YEARS = [1, 3, 5, 10];

export default function JarDetail() {
  const { jar: jarParam } = useLocalSearchParams<{ jar: string }>();
  const jar = (["spend", "save", "share", "invest"].includes(jarParam ?? "") ? jarParam : "save") as JarKind;
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const state = useFamilyState();
  const [years, setYears] = useState(5);
  const entries = useMemo(() => (kid ? entriesForKid(state.ledger, kid.id).filter((e) => e.jar === jar).slice(0, 25) : []), [state.ledger, kid, jar]);
  if (!kid || !summary) return null;
  const palette = colors.jars[jar];
  const info = JAR_INFO[jar];
  const balance = summary.jars[jar];
  const rate = summary.interestRule?.active ? summary.interestRule.annualRatePercent : 0;
  const monthly = summary.allowance ? Math.round((summary.allowance.amountPaise * summary.allowance.allocation.save) / 100) * 4 : rupees(100);
  const growth = jar === "save" && rate > 0 ? projectGrowth({ principalPaise: balance, monthlyContributionPaise: monthly, annualRatePercent: rate, months: years * 12 }) : null;
  const last = growth ? growth[growth.length - 1] : null;
  const maxBar = last ? last.balancePaise : 1;

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton name="close" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>
      <View style={[styles.hero, { backgroundColor: palette.soft, borderRadius: radius.xxl, padding: space.xl, marginTop: space.md }]}>
        <Text style={{ fontSize: 64 }}>{info.emoji}</Text>
        <Text variant="h2" color={palette.dark}>
          {info.label} jar
        </Text>
        <Money paise={balance} variant="moneyLg" />
        <Text variant="caption" tone="muted" align="center">
          {info.blurb}
          {summary.allowance ? ` · ${summary.allowance.allocation[jar]}% of every rupee you earn` : ""}
        </Text>
      </View>

      {growth && last ? (
        <Card style={{ marginTop: space.xl }}>
          <Text variant="h3">Watch it grow 🌱</Text>
          <Text variant="caption" tone="muted">
            Bank of Mum & Dad pays {rate}% a year. If you keep adding {formatINR(monthly, { showPaise: false })} a month…
          </Text>
          <View style={[styles.chips, { marginTop: space.md }]}>
            {YEARS.map((y) => (
              <Chip key={y} label={`${y} yr`} selected={years === y} onPress={() => setYears(y)} />
            ))}
          </View>
          <View style={[styles.chart, { marginTop: space.lg }]}>
            {growth
              .filter((_, i) => i % Math.max(1, Math.floor(growth.length / 12)) === 0 || i === growth.length - 1)
              .map((p) => (
                <View key={p.month} style={styles.barCol}>
                  <View style={[styles.bar, { height: Math.max(4, (p.balancePaise / maxBar) * 120), backgroundColor: palette.main, borderRadius: 6 }]}>
                    <View style={{ height: `${(p.interestPaise / Math.max(1, p.balancePaise)) * 100}%`, backgroundColor: colors.accent, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                  </View>
                </View>
              ))}
          </View>
          <View style={[styles.legend, { marginTop: space.md }]}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: palette.main }]} />
              <Text variant="caption" tone="muted">
                You put in {formatINR(last.contributedPaise, { showPaise: false })}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text variant="caption" tone="muted">
                Interest adds {formatINR(last.interestPaise, { showPaise: false })}
              </Text>
            </View>
          </View>
          <Text variant="h3" style={{ marginTop: space.sm }}>
            In {years} year{years > 1 ? "s" : ""}: {formatINR(last.balancePaise, { showPaise: false })}
          </Text>
        </Card>
      ) : null}

      <Card style={{ marginTop: space.xl }} padding={space.md}>
        <Text variant="h3" style={{ marginBottom: space.sm, marginLeft: 4 }}>
          History
        </Text>
        {entries.length === 0 ? <EmptyState emoji="🫙" title="Empty jar" body="Money shows up here as you earn." /> : null}
        {entries.map((e, i) => (
          <ListRow
            key={e.id}
            emoji={e.emoji ?? (e.amountPaise > 0 ? "➕" : "➖")}
            leadingColor={e.amountPaise > 0 ? colors.successSoft : colors.dangerSoft}
            title={e.memo}
            subtitle={new Date(e.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            trailing={<Money paise={e.amountPaise} variant="bodyStrong" signed tone={e.amountPaise > 0 ? "success" : "default"} />}
            last={i === entries.length - 1}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "flex-start" },
  hero: { alignItems: "center", gap: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 124 },
  barCol: { flex: 1, alignItems: "stretch", justifyContent: "flex-end" },
  bar: { overflow: "hidden", justifyContent: "flex-start" },
  legend: { gap: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
