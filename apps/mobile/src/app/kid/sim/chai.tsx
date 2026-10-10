import {
  CHAI_CUPS_OPTIONS,
  CHAI_DAYS,
  CHAI_PRICE_OPTIONS,
  CHAI_SIM_ID,
  CHAI_STALL_RENT,
  commands,
  forecastFor,
  formatINR,
  playChaiDay,
  scoreChaiGame,
  WEATHER_INFO,
  type ChaiDayResult,
} from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

import { Button, Card, Chip, Confetti, IconButton, Money, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { haptic } from "@/lib/haptics";
import { useDispatch } from "@/store/family-store";
import { toast } from "@/store/toast-store";

type Phase = "plan" | "result" | "summary";

/** Chai stall: five days at the school mela. Teaches cost, price, demand and profit by doing. */
export default function ChaiStall() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const dispatch = useDispatch();
  const [seed, setSeed] = useState(0);
  const [price, setPrice] = useState<number>(CHAI_PRICE_OPTIONS[1]);
  const [cups, setCups] = useState<number>(CHAI_CUPS_OPTIONS[1]);
  const [results, setResults] = useState<ChaiDayResult[]>([]);
  const [phase, setPhase] = useState<Phase>("plan");
  const [collected, setCollected] = useState<{ xp: number; firstTime: boolean } | null>(null);
  const forecast = forecastFor(seed);
  const day = results.length + (phase === "result" ? 0 : 1);
  const current = results[results.length - 1];
  const weather = forecast[Math.min(results.length, CHAI_DAYS - 1)] ?? "sunny";
  const total = results.reduce((s, r) => s + r.profitPaise, 0);
  const score = scoreChaiGame(results);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/kid/learn"));

  const open = () => {
    haptic.press();
    const result = playChaiDay(results.length + 1, forecast[results.length] ?? "sunny", { pricePaise: price, cupsMade: cups });
    setResults([...results, result]);
    setPhase("result");
  };

  const nextDay = () => {
    haptic.tap();
    setPhase(results.length >= CHAI_DAYS ? "summary" : "plan");
  };

  const collect = () => {
    if (!kid) return;
    const ok = tryCommand(
      () => {
        const out = dispatch((s, now) => commands.completeSimulation(s, kid.id, CHAI_SIM_ID, { percent: Math.round((score.stars / 3) * 100), xp: score.xp }, now));
        setCollected({ xp: out.xpEarned, firstTime: out.firstTime });
        haptic.success();
      },
      { onPremiumRequired: () => toast({ title: "Ask a parent to unlock simulations", body: "They’re part of Family Premium", emoji: "🔒" }) },
    );
    void ok;
  };

  const replay = () => {
    setSeed(Date.now() % 7);
    setResults([]);
    setCollected(null);
    setPhase("plan");
  };

  if (phase === "summary") {
    return (
      <Screen scroll contentStyle={{ paddingTop: space.lg }}>
        {collected ? <Confetti /> : null}
        <View style={styles.topBar}>
          <IconButton name="close" accessibilityLabel="Close" onPress={close} />
          <Text variant="h3">Mela over!</Text>
          <View style={{ width: 40 }} />
        </View>
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: "center", marginTop: space.xl, gap: space.sm }}>
          <Text style={{ fontSize: 56, lineHeight: 72 }}>{"⭐".repeat(score.stars)}{"☆".repeat(3 - score.stars)}</Text>
          <Text variant="label" tone="muted">
            Your 5-day total
          </Text>
          <Money paise={score.totalProfitPaise} variant="moneyLg" signed tone={score.totalProfitPaise >= 0 ? "success" : "danger"} />
          <Text variant="body" tone="muted" align="center">
            {score.verdict}
          </Text>
        </Animated.View>
        <Card style={{ marginTop: space.xl }} padding={space.md}>
          {results.map((r) => (
            <View key={r.day} style={[styles.dayRow, { borderBottomColor: colors.border, borderBottomWidth: r.day === CHAI_DAYS ? 0 : 1 }]}>
              <Text style={{ fontSize: 20 }}>{WEATHER_INFO[r.weather].emoji}</Text>
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                Day {r.day} · {formatINR(r.pricePaise, { showPaise: false })} × {r.sold} sold ({r.cupsMade} made)
              </Text>
              <Money paise={r.profitPaise} variant="captionStrong" signed tone={r.profitPaise >= 0 ? "success" : "danger"} />
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
          <Text variant="h3">Chai stall ☕</Text>
          <Text variant="caption" tone="muted">
            Day {Math.min(day, CHAI_DAYS)} of {CHAI_DAYS}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", width: 80 }}>
          <Text variant="label" tone="muted">
            Profit
          </Text>
          <Money paise={total} variant="captionStrong" signed tone={total >= 0 ? "success" : "danger"} />
        </View>
      </View>

      <View style={[styles.forecast, { marginTop: space.lg }]}>
        {forecast.map((w, i) => {
          const done = i < results.length;
          const active = i === results.length && phase === "plan";
          return (
            <View key={i} style={[styles.forecastDay, { backgroundColor: active ? colors.primarySoft : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: radius.md, opacity: done ? 0.55 : 1 }]}>
              <Text style={{ fontSize: 22 }}>{WEATHER_INFO[w].emoji}</Text>
              <Text style={{ fontFamily: fontFamily.bold, fontSize: 10, color: colors.textMuted }}>D{i + 1}</Text>
            </View>
          );
        })}
      </View>

      {phase === "plan" ? (
        <Animated.View key={`plan-${results.length}`} entering={FadeInUp}>
          <Card tint={colors.surfaceAlt} borderColor="transparent" style={{ marginTop: space.lg }}>
            <View style={styles.row}>
              <Text style={{ fontSize: 40 }}>{WEATHER_INFO[weather].emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="h3">Today: {WEATHER_INFO[weather].label}</Text>
                <Text variant="caption" tone="muted">
                  {WEATHER_INFO[weather].hint} Each cup costs you ₹8 to make, plus {formatINR(CHAI_STALL_RENT, { showPaise: false })} stall rent.
                </Text>
              </View>
            </View>
          </Card>
          <Text variant="h3" style={{ marginTop: space.xl }}>
            Price per cup
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {CHAI_PRICE_OPTIONS.map((p) => (
              <Chip key={p} label={formatINR(p, { showPaise: false })} selected={price === p} onPress={() => setPrice(p)} />
            ))}
          </View>
          <Text variant="h3" style={{ marginTop: space.lg }}>
            Cups to make
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {CHAI_CUPS_OPTIONS.map((c) => (
              <Chip key={c} label={`${c} cups`} selected={cups === c} onPress={() => setCups(c)} />
            ))}
          </View>
          <Card style={{ marginTop: space.lg }}>
            <Text variant="caption" tone="muted">
              Your costs today
            </Text>
            <Money paise={cups * 8_00 + CHAI_STALL_RENT} variant="h2" />
            <Text variant="caption" tone="soft">
              You need to sell {Math.ceil((cups * 8_00 + CHAI_STALL_RENT) / price)} cups at {formatINR(price, { showPaise: false })} just to break even.
            </Text>
          </Card>
          <Button title="Open the stall!" size="lg" full onPress={open} style={{ marginTop: space.xl }} />
        </Animated.View>
      ) : current ? (
        <Animated.View key={`result-${current.day}`} entering={FadeInUp}>
          <Card tint={current.profitPaise >= 0 ? colors.successSoft : colors.dangerSoft} borderColor="transparent" style={{ marginTop: space.lg }}>
            <Text variant="label" tone="muted">
              Day {current.day} · {WEATHER_INFO[current.weather].label}
            </Text>
            <View style={[styles.row, { marginTop: 4 }]}>
              <Text style={{ fontSize: 44 }}>{current.profitPaise >= 0 ? "🤑" : "😬"}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">
                  {current.profitPaise >= 0 ? "Profit" : "Loss"}
                </Text>
                <Money paise={current.profitPaise} variant="moneyLg" signed tone={current.profitPaise >= 0 ? "success" : "danger"} />
              </View>
            </View>
          </Card>
          <Card style={{ marginTop: space.md }}>
            <View style={styles.statGrid}>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  Wanted
                </Text>
                <Text variant="h3">{current.demand} cups</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  Sold
                </Text>
                <Text variant="h3">{current.sold} cups</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  Wasted
                </Text>
                <Text variant="h3" tone={current.wasted > 10 ? "danger" : "default"}>
                  {current.wasted}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  Walked away
                </Text>
                <Text variant="h3" tone={current.missed > 10 ? "warning" : "default"}>
                  {current.missed}
                </Text>
              </View>
            </View>
            <View style={[styles.statGrid, { marginTop: space.md }]}>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  Money in
                </Text>
                <Money paise={current.revenuePaise} variant="bodyStrong" />
              </View>
              <View style={styles.stat}>
                <Text variant="caption" tone="muted">
                  Money out
                </Text>
                <Money paise={current.costPaise} variant="bodyStrong" />
              </View>
            </View>
          </Card>
          <Card tint={colors.infoSoft} borderColor="transparent" style={{ marginTop: space.md }}>
            <Text variant="bodyStrong">💡 {current.tip}</Text>
          </Card>
          <Button title={results.length >= CHAI_DAYS ? "See results" : "Next day"} size="lg" full onPress={nextDay} style={{ marginTop: space.xl }} />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  forecast: { flexDirection: "row", gap: 8 },
  forecastDay: { flex: 1, alignItems: "center", paddingVertical: 8, borderWidth: 1.5, gap: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { minWidth: "40%", flexGrow: 1 },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
});
