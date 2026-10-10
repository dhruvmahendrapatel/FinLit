import { formatINR, loanProgress, type Loan } from "@finlit/core";
import { StyleSheet, View } from "react-native";

import { Card, Chip, Money, ProgressBar, Text } from "@/components/ui";
import { useTheme } from "@/design";

const STATUS: Record<Loan["status"], { label: string; tone: "warning" | "primary" | "success" | "neutral"; emoji: string }> = {
  requested: { label: "Waiting for a parent", tone: "warning", emoji: "⏳" },
  active: { label: "Repaying", tone: "primary", emoji: "🧾" },
  repaid: { label: "Paid off!", tone: "success", emoji: "🎉" },
  declined: { label: "Not this time", tone: "neutral", emoji: "🙅" },
};

/** A family loan with its repayment progress. Used on the kid's Goals tab and the parent's kid detail. */
export function LoanCard({ loan, children }: { loan: Loan; children?: React.ReactNode }) {
  const { colors, radius, space } = useTheme();
  const progress = loanProgress(loan);
  const status = STATUS[loan.status];
  const period = loan.cadence === "weekly" ? "week" : "month";
  return (
    <Card radius={radius.xl}>
      <View style={styles.row}>
        <View style={[styles.emoji, { backgroundColor: colors.warningSoft, borderRadius: radius.md }]}>
          <Text style={{ fontSize: 28 }}>{loan.emoji}</Text>
        </View>
        <View style={styles.text}>
          <Text variant="h3" numberOfLines={1}>
            Loan for {loan.purpose}
          </Text>
          <Text variant="caption" tone="muted">
            {formatINR(loan.principalPaise, { showPaise: false })} borrowed · {loan.annualRatePercent}% a year · {loan.instalments} {period}s
          </Text>
        </View>
        <Chip label={status.label} tone={status.tone} emoji={status.emoji} size="sm" />
      </View>
      {loan.status === "active" || loan.status === "repaid" ? (
        <>
          <ProgressBar percent={progress.percent} color={loan.status === "repaid" ? colors.success : colors.warning} style={{ marginTop: space.md }} />
          <View style={[styles.stats, { marginTop: space.sm }]}>
            <View>
              <Text variant="caption" tone="muted">
                Repaid
              </Text>
              <Money paise={loan.repaidPaise} variant="bodyStrong" />
            </View>
            <View>
              <Text variant="caption" tone="muted">
                Still owed
              </Text>
              <Money paise={progress.remainingPaise} variant="bodyStrong" />
            </View>
            <View>
              <Text variant="caption" tone="muted">
                Next EMI
              </Text>
              <Money paise={progress.nextDuePaise} variant="bodyStrong" />
            </View>
          </View>
          {loan.status === "active" ? (
            <Text variant="caption" tone="soft" style={{ marginTop: space.sm }}>
              Each {period} on pocket-money day, {formatINR(loan.emiPaise, { showPaise: false })} comes out of your Spend jar until it’s paid.
            </Text>
          ) : null}
        </>
      ) : loan.status === "declined" && loan.declineReason ? (
        <Text variant="caption" tone="muted" style={{ marginTop: space.sm }}>
          “{loan.declineReason}”
        </Text>
      ) : null}
      {children ? <View style={{ marginTop: space.md }}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
  stats: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
});
