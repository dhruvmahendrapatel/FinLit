import {
  chooseTripOption,
  commands,
  currentTripStep,
  formatINR,
  isTripComplete,
  percentOf,
  scoreTrip,
  startTrip,
  TRIP_BUDGET_PAISE,
  TRIP_BUFFER_PAISE,
  TRIP_FAMILY_SIZE,
  TRIP_SIM_ID,
  TRIP_STEP_COUNT,
  tripLeft,
  tripLines,
  tripSpent,
  tripTip,
  type Paise,
  type TripOption,
  type TripState,
} from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

import { Button, Card, Confetti, IconButton, Money, ProgressBar, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { haptic } from "@/lib/haptics";
import { useDispatch } from "@/store/family-store";
import { toast } from "@/store/toast-store";

type Phase = "plan" | "result" | "summary";

/** Family trip budget: two days in Lonavala for four on ₹5,000. Teaches needs vs wants, buffer money and trade-offs. */
export default function FamilyTrip() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const dispatch = useDispatch();
  const [trip, setTrip] = useState<TripState>(() => startTrip(0));
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("plan");
  const [collected, setCollected] = useState<{ xp: number; firstTime: boolean } | null>(null);

  const step = currentTripStep(trip);
  const lines = tripLines(trip);
  const last = lines[lines.length - 1];
  const spent = tripSpent(trip);
  const left = tripLeft(trip);
  const score = scoreTrip(trip);
  const choiceNo = Math.min(trip.picks.length + (phase === "plan" ? 1 : 0), TRIP_STEP_COUNT);
  const selectedOption = step?.options.find((o) => o.id === selected);
  const preview = selectedOption ? left - selectedOption.costPaise : left;

  const close = () => (router.canGoBack() ? router.back() : router.replace("/kid/learn"));

  const lockIn = () => {
    if (!selectedOption) return;
    haptic.press();
    setTrip(chooseTripOption(trip, selectedOption.id));
    setSelected(null);
    setPhase("result");
  };

  const next = () => {
    haptic.tap();
    setPhase(isTripComplete(trip) ? "summary" : "plan");
  };

  const collect = () => {
    if (!kid) return;
    const ok = tryCommand(
      () => {
        const out = dispatch((s, now) => commands.completeSimulation(s, kid.id, TRIP_SIM_ID, { percent: Math.round((score.stars / 3) * 100), xp: score.xp }, now));
        setCollected({ xp: out.xpEarned, firstTime: out.firstTime });
        haptic.success();
      },
      { onPremiumRequired: () => toast({ title: "Ask a parent to unlock simulations", body: "They’re part of Family Premium", emoji: "🔒" }) },
    );
    void ok;
  };

  const replay = () => {
    setTrip(startTrip(Date.now() % 3));
    setSelected(null);
    setCollected(null);
    setPhase("plan");
  };

  if (phase === "summary") {
    return (
      <Screen scroll contentStyle={{ paddingTop: space.lg }}>
        {collected ? <Confetti /> : null}
        <View style={styles.topBar}>
          <IconButton name="close" accessibilityLabel="Close" onPress={close} />
          <Text variant="h3">Trip over!</Text>
          <View style={{ width: 40 }} />
        </View>
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: "center", marginTop: space.xl, gap: space.sm }}>
          <Text style={{ fontSize: 56, lineHeight: 72 }}>{"⭐".repeat(score.stars)}{"☆".repeat(3 - score.stars)}</Text>
          <Text variant="label" tone="muted">
            You spent
          </Text>
          <Money paise={score.spentPaise} variant="moneyLg" tone={score.overBudget ? "danger" : "success"} />
          <Text variant="caption" tone="muted">
            of {formatINR(score.budgetPaise, { showPaise: false })} · {score.overBudget ? `${formatINR(score.overByPaise, { showPaise: false })} over budget` : `${formatINR(score.leftPaise, { showPaise: false })} left over`}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {score.verdict}
          </Text>
        </Animated.View>

        <BudgetBar left={score.leftPaise} budget={score.budgetPaise} style={{ marginTop: space.xl }} />

        <Card style={{ marginTop: space.lg }} padding={space.md}>
          {score.lines.map((l, i) => (
            <View key={l.step.id} style={[styles.lineRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <Text style={{ fontSize: 20 }}>{l.option.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="captionStrong">{l.option.label}</Text>
                <Text variant="caption" tone="muted">
                  {i + 1}. {l.step.title}
                </Text>
              </View>
              {l.option.costPaise === 0 ? (
                <Text variant="captionStrong" tone="success">
                  Free
                </Text>
              ) : (
                <Money paise={l.option.costPaise} variant="captionStrong" />
              )}
            </View>
          ))}
          <View style={[styles.lineRow, { paddingBottom: 0 }]}>
            <Text style={{ fontSize: 20 }}>🧮</Text>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              Total vs budget
            </Text>
            <Money paise={score.spentPaise} variant="bodyStrong" tone={score.overBudget ? "danger" : "default"} />
            <Text variant="caption" tone="muted">
              / {formatINR(score.budgetPaise, { showPaise: false })}
            </Text>
          </View>
        </Card>

        <Card style={{ marginTop: space.md }}>
          <View style={styles.statGrid}>
            <View style={styles.stat}>
              <Text variant="caption" tone="muted">
                Fun
              </Text>
              <Text variant="h3">
                🎉 {score.fun} / {score.maxFun}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="caption" tone="muted">
                Comfort & safety
              </Text>
              <Text variant="h3">
                🛡️ {score.comfort} / {score.maxComfort}
              </Text>
            </View>
          </View>
        </Card>

        <Card tint={colors.infoSoft} borderColor="transparent" style={{ marginTop: space.md }}>
          <Text variant="h3">What this trip taught</Text>
          {score.lessons.map((lesson) => (
            <View key={lesson} style={[styles.row, { alignItems: "flex-start", marginTop: space.sm }]}>
              <Text variant="bodyStrong">💡</Text>
              <Text variant="body" style={{ flex: 1 }}>
                {lesson}
              </Text>
            </View>
          ))}
        </Card>

        {collected ? (
          <Card tint={colors.accentSoft} borderColor="transparent" style={{ marginTop: space.lg }}>
            <Text variant="h3" align="center">
              {collected.firstTime ? `+${collected.xp} XP collected!` : "Replay: no extra XP, but a great practice run"}
            </Text>
          </Card>
        ) : null}
        <View style={{ marginTop: space.xl, gap: space.sm }}>
          {collected ? <Button title="Done" size="lg" full onPress={close} /> : <Button title={`Collect ${score.xp} XP`} size="lg" full variant="accent" onPress={collect} />}
          <Button title="Play again" variant="ghost" size="sm" full onPress={replay} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={{ paddingTop: space.lg }}>
      <View style={styles.topBar}>
        <IconButton name="close" accessibilityLabel="Close" onPress={close} />
        <View style={{ alignItems: "center" }}>
          <Text variant="h3">Family trip 🧳</Text>
          <Text variant="caption" tone="muted">
            Choice {choiceNo} of {TRIP_STEP_COUNT}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", width: 80 }}>
          <Text variant="label" tone="muted">
            Spent
          </Text>
          <Money paise={spent} variant="captionStrong" tone={left < 0 ? "danger" : "default"} />
        </View>
      </View>

      <BudgetBar left={phase === "plan" ? preview : left} budget={trip.budgetPaise} previewing={phase === "plan" && !!selectedOption} style={{ marginTop: space.lg }} />

      <View style={[styles.strip, { marginTop: space.md }]}>
        {trip.steps.map((s, i) => {
          const done = i < trip.picks.length;
          const active = i === trip.picks.length && phase === "plan";
          return (
            <View
              key={`${s.id}-${i}`}
              style={[
                styles.stripStep,
                { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: radius.md, opacity: done ? 0.55 : 1 },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{s.kind === "surprise" && !done && !active ? "❓" : s.emoji}</Text>
              <Text style={{ fontFamily: fontFamily.bold, fontSize: 10, color: colors.textMuted }}>{i + 1}</Text>
            </View>
          );
        })}
      </View>

      {phase === "plan" && step ? (
        <Animated.View key={`plan-${trip.picks.length}`} entering={FadeInUp}>
          {trip.picks.length === 0 ? (
            <Card tint={colors.accentSoft} borderColor="transparent" style={{ marginTop: space.lg }}>
              <Text variant="bodyStrong">
                Your family of {TRIP_FAMILY_SIZE} has {formatINR(TRIP_BUDGET_PAISE, { showPaise: false })} for two days in Lonavala. Make it fun, keep everyone comfy, and don’t run out of money!
              </Text>
            </Card>
          ) : null}
          <Card tint={step.kind === "surprise" ? colors.warningSoft : colors.surfaceAlt} borderColor="transparent" style={{ marginTop: space.lg }}>
            <View style={styles.row}>
              <Text style={{ fontSize: 40 }}>{step.emoji}</Text>
              <View style={{ flex: 1 }}>
                {step.kind === "surprise" ? (
                  <Text variant="label" tone="danger">
                    Unexpected!
                  </Text>
                ) : null}
                <Text variant="h3">{step.title}</Text>
                <Text variant="caption" tone="muted">
                  {step.prompt}
                </Text>
              </View>
            </View>
          </Card>

          <View style={{ marginTop: space.lg, gap: space.sm }}>
            {step.options.map((o) => (
              <OptionCard key={o.id} option={o} selected={selected === o.id} onPress={() => setSelected(o.id)} />
            ))}
          </View>

          <Card style={{ marginTop: space.lg }}>
            <Text variant="caption" tone="muted">
              {selectedOption ? "Budget left after this" : "Budget left"}
            </Text>
            <Money paise={preview} variant="h2" tone={preview < 0 ? "danger" : preview < TRIP_BUFFER_PAISE ? "warning" : "default"} />
            <Text variant="caption" tone="soft">
              {preview < 0
                ? "That takes you over budget. Someone will have to borrow."
                : preview < TRIP_BUFFER_PAISE
                  ? `Under ${formatINR(TRIP_BUFFER_PAISE, { showPaise: false })} left: no cushion if something goes wrong.`
                  : `Keep about ${formatINR(TRIP_BUFFER_PAISE, { showPaise: false })} spare for surprises.`}
            </Text>
          </Card>
          <Button title="Lock it in" size="lg" full disabled={!selectedOption} onPress={lockIn} style={{ marginTop: space.xl }} />
        </Animated.View>
      ) : last ? (
        <Animated.View key={`result-${lines.length}`} entering={FadeInUp}>
          <Card tint={left < 0 ? colors.dangerSoft : last.step.kind === "surprise" ? colors.warningSoft : colors.successSoft} borderColor="transparent" style={{ marginTop: space.lg }}>
            <Text variant="label" tone="muted">
              {last.step.title}
            </Text>
            <View style={[styles.row, { marginTop: 4 }]}>
              <Text style={{ fontSize: 44 }}>{last.option.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="h3">{last.option.label}</Text>
                <Text variant="caption" tone="muted">
                  {last.option.costPaise === 0 ? "Cost: nothing at all" : `Cost: ${formatINR(last.option.costPaise, { showPaise: false })}`}
                </Text>
              </View>
            </View>
          </Card>
          <Card style={{ marginTop: space.md }}>
            <View style={styles.statGrid}>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  Spent so far
                </Text>
                <Money paise={spent} variant="h3" />
              </View>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  {left < 0 ? "Over budget by" : "Budget left"}
                </Text>
                <Money paise={Math.abs(left)} variant="h3" tone={left < 0 ? "danger" : left < TRIP_BUFFER_PAISE ? "warning" : "success"} />
              </View>
            </View>
            <View style={[styles.statGrid, { marginTop: space.md }]}>
              <View style={styles.stat}>
                <Pips label="Fun" value={last.option.fun} color={colors.accent} />
              </View>
              <View style={styles.stat}>
                <Pips label="Comfort" value={last.option.comfort} color={colors.info} />
              </View>
            </View>
          </Card>
          <Card tint={left < 0 ? colors.dangerSoft : colors.infoSoft} borderColor="transparent" style={{ marginTop: space.md }}>
            <Text variant="bodyStrong">💡 {tripTip(trip)}</Text>
          </Card>
          <Button title={isTripComplete(trip) ? "See how it went" : "Next stop"} size="lg" full onPress={next} style={{ marginTop: space.xl }} />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

function BudgetBar({ left, budget, previewing = false, style }: { left: Paise; budget: Paise; previewing?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors, space } = useTheme();
  const color = left < 0 ? colors.danger : left < TRIP_BUFFER_PAISE ? colors.warning : colors.success;
  return (
    <View style={style}>
      <View style={[styles.row, { justifyContent: "space-between", marginBottom: space.xs }]}>
        <Text variant="label" tone="muted">
          {previewing ? "Budget after this choice" : "Budget left"}
        </Text>
        <Money paise={left} variant="captionStrong" signed={left < 0} tone={left < 0 ? "danger" : left < TRIP_BUFFER_PAISE ? "warning" : "success"} />
      </View>
      <ProgressBar percent={percentOf(left, budget)} color={color} height={14} />
      <Text variant="label" tone="soft" style={{ marginTop: space.xs }}>
        of {formatINR(budget, { showPaise: false })}
      </Text>
    </View>
  );
}

function OptionCard({ option, selected, onPress }: { option: TripOption; selected: boolean; onPress: () => void }) {
  const { colors, radius, space, shadow } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={option.label}
      onPressIn={() => haptic.tap()}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        shadow.card,
        { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? colors.primary : colors.border, borderRadius: radius.lg, padding: space.md },
        pressed && styles.pressed,
      ]}
    >
      <Text style={{ fontSize: 32 }}>{option.emoji}</Text>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={[styles.row, { gap: 8 }]}>
          <Text variant="h3" style={{ flex: 1 }}>
            {option.label}
          </Text>
          {option.costPaise === 0 ? (
            <Text variant="bodyStrong" tone="success">
              Free
            </Text>
          ) : (
            <Money paise={option.costPaise} variant="bodyStrong" />
          )}
        </View>
        <Text variant="caption" tone="muted">
          {option.blurb}
        </Text>
        <View style={[styles.row, { gap: 14, marginTop: 2 }]}>
          <Pips label="Fun" value={option.fun} color={colors.accent} />
          <Pips label="Comfort" value={option.comfort} color={colors.info} />
        </View>
      </View>
    </Pressable>
  );
}

function Pips({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.pips}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.pip, { backgroundColor: i < value ? color : colors.bgAlt }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  strip: { flexDirection: "row", gap: 6 },
  stripStep: { flex: 1, alignItems: "center", paddingVertical: 6, borderWidth: 1.5, gap: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  option: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1.5 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
  pips: { flexDirection: "row", alignItems: "center", gap: 4 },
  pip: { width: 9, height: 9, borderRadius: 5 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { minWidth: "40%", flexGrow: 1 },
  lineRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
});
