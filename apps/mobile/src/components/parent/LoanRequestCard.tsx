import { formatINR, LOAN_RATE_OPTIONS, planLoan, type Kid, type Loan } from "@finlit/core";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Avatar, Button, Card, Chip, Money, Text } from "@/components/ui";
import { useTheme } from "@/design";

export interface LoanRequestCardProps {
  loan: Loan;
  kid: Kid | undefined;
  onApprove: (annualRatePercent: number) => void;
  onDecline: () => void;
}

/** A kid's loan request: the parent picks the interest rate and approves or declines. */
export function LoanRequestCard({ loan, kid, onApprove, onDecline }: LoanRequestCardProps) {
  const { colors, space, radius } = useTheme();
  const [rate, setRate] = useState<number>(12);
  const plan = planLoan({ principalPaise: loan.principalPaise, annualRatePercent: rate, instalments: loan.instalments, cadence: loan.cadence });
  const period = loan.cadence === "weekly" ? "week" : "month";
  return (
    <Card tint={colors.infoSoft} borderColor="transparent">
      <View style={styles.row}>
        {kid ? <Avatar avatar={kid.avatar} size={44} /> : null}
        <View style={styles.text}>
          <Text variant="bodyStrong">
            {kid?.name ?? "Someone"} wants to borrow {formatINR(loan.principalPaise, { showPaise: false })} for “{loan.purpose}”
          </Text>
          <Text variant="caption" tone="muted">
            Repaid over {loan.instalments} {period}s from the Spend jar on pocket-money day
          </Text>
        </View>
        <View style={[styles.amount, { backgroundColor: colors.surface, borderRadius: radius.pill }]}>
          <Text style={{ fontSize: 18 }}>{loan.emoji}</Text>
        </View>
      </View>
      <Text variant="label" tone="muted" style={{ marginTop: space.md }}>
        Interest rate
      </Text>
      <View style={[styles.wrap, { marginTop: space.sm }]}>
        {LOAN_RATE_OPTIONS.map((r) => (
          <Chip key={r} label={r === 0 ? "0% · interest-free" : `${r}% a year`} selected={rate === r} onPress={() => setRate(r)} />
        ))}
      </View>
      <View style={[styles.plan, { marginTop: space.sm }]}>
        <Text variant="caption" tone="muted">
          They repay <Money paise={plan.totalPaise} variant="captionStrong" /> in {loan.instalments} EMIs of about <Money paise={plan.emiPaise} variant="captionStrong" />
          {plan.interestPaise > 0 ? ` (${formatINR(plan.interestPaise, { showPaise: false })} interest)` : ""}.
        </Text>
      </View>
      <View style={[styles.actions, { marginTop: space.md }]}>
        <Button title="Not now" variant="surface" size="sm" onPress={onDecline} />
        <Button title="Approve loan" size="sm" onPress={() => onApprove(rate)} style={styles.grow} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1, gap: 2 },
  amount: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  plan: {},
  actions: { flexDirection: "row", gap: 8 },
  grow: { flexGrow: 1 },
});
