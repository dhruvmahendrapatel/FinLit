import { commands, formatINR, LOAN_INSTALMENT_OPTIONS, planLoan, rupees } from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Button, Card, Chip, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid, useKidSummary } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { useDispatch } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const AMOUNTS = [200, 500, 1000, 2000];
const EXAMPLE_RATE = 12;

/** Kid asks the parent-bank for a loan. Teaches: borrowing costs extra, and EMIs come out of pocket money. */
export default function NewLoan() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const summary = useKidSummary(kid?.id);
  const dispatch = useDispatch();
  const goals = summary?.activeGoals ?? [];
  const [purpose, setPurpose] = useState(goals[0]?.title ?? "");
  const [emoji, setEmoji] = useState(goals[0]?.emoji ?? "🧾");
  const [amount, setAmount] = useState(500);
  const [instalments, setInstalments] = useState<number>(8);
  const cadence = summary?.allowance?.cadence ?? "weekly";
  const period = cadence === "weekly" ? "week" : "month";
  const plan = planLoan({ principalPaise: rupees(amount), annualRatePercent: EXAMPLE_RATE, instalments, cadence });

  const submit = () => {
    if (!kid) return;
    const ok = tryCommand(
      () => dispatch((s, now) => commands.requestLoan(s, { kidId: kid.id, purpose, emoji, principalPaise: rupees(amount), instalments }, now)),
      { onPremiumRequired: () => toast({ title: "Ask a parent to unlock family loans", body: "They’re part of Family Premium", emoji: "🔒" }) },
    );
    if (ok) {
      toast({ title: "Loan requested", body: "Your parents will set the interest and approve it", emoji: "🧾", tone: "success" });
      router.back();
    }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant="title">Borrow from Mum & Dad</Text>
        <IconButton name="close" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>
      <Text variant="body" tone="muted">
        Get something now and pay it back bit by bit from your pocket money. Borrowing costs a little extra: that’s interest.
      </Text>

      <Card style={{ marginTop: space.xl }}>
        <View style={{ gap: space.lg }}>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              What is it for?
            </Text>
            <View style={styles.wrap}>
              {goals.map((g) => (
                <Chip key={g.id} label={g.title} emoji={g.emoji} selected={purpose === g.title} onPress={() => { setPurpose(g.title); setEmoji(g.emoji); }} />
              ))}
            </View>
            <TextInput value={purpose} onChangeText={setPurpose} placeholder="Cricket bat" placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.semiBold, color: colors.text }]} />
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              How much?
            </Text>
            <View style={styles.wrap}>
              {AMOUNTS.map((a) => (
                <Chip key={a} label={`₹${a}`} selected={amount === a} onPress={() => setAmount(a)} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              Pay back over
            </Text>
            <View style={styles.wrap}>
              {LOAN_INSTALMENT_OPTIONS.map((n) => (
                <Chip key={n} label={`${n} ${period}s`} selected={instalments === n} onPress={() => setInstalments(n)} />
              ))}
            </View>
          </View>
        </View>
      </Card>

      <Card tint={colors.warningSoft} borderColor="transparent" style={{ marginTop: space.lg }}>
        <Text variant="h3">If your parents charge {EXAMPLE_RATE}% a year…</Text>
        <Text variant="body" style={{ marginTop: 4 }}>
          You’d pay back {formatINR(plan.totalPaise, { showPaise: false })} in {instalments} EMIs of about {formatINR(plan.emiPaise, { showPaise: false })}. The extra {formatINR(plan.interestPaise, { showPaise: false })} is interest.
        </Text>
        <Text variant="caption" tone="muted" style={{ marginTop: space.sm }}>
          Each EMI comes straight out of your Spend jar on pocket-money day. Your parents set the real rate when they approve.
        </Text>
      </Card>

      <Button title="Ask for the loan" size="lg" full disabled={purpose.trim().length === 0} onPress={submit} style={{ marginTop: space.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { height: 50, borderWidth: 1.5, fontSize: 15, paddingHorizontal: 14 },
});
