import { commands, lessonById, levelFor, unitById, type Lesson } from "@finlit/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInRight, FadeInUp, ZoomIn } from "react-native-reanimated";

import { Button, Card, Confetti, Icon, IconButton, ProgressBar, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid } from "@/hooks/use-family";
import { haptic } from "@/lib/haptics";
import { useDispatch } from "@/store/family-store";

type Result = ReturnType<typeof commands.completeLesson>;

export default function LessonPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useMemo(() => (id ? lessonById(id) : undefined), [id]);
  const router = useRouter();
  const kid = useActiveKid();
  if (!lesson || !kid) {
    return (
      <Screen>
        <Text variant="h2">Lesson not found</Text>
        <Button title="Back" onPress={() => router.back()} />
      </Screen>
    );
  }
  return <Player lesson={lesson} kidId={kid.id} />;
}

function Player({ lesson, kidId }: { lesson: Lesson; kidId: string }) {
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const unit = unitById(lesson.unitId);
  const totalSteps = lesson.cards.length + lesson.quiz.length;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/kid/learn"));
  const inCards = step < lesson.cards.length;
  const quizIndex = step - lesson.cards.length;
  const question = lesson.quiz[quizIndex];
  const accent = unit?.color ?? colors.primary;

  const finish = (finalAnswers: (number | null)[]) => {
    try {
      const outcome = dispatch((s, now) => commands.completeLesson(s, kidId, lesson.id, finalAnswers, now));
      haptic.success();
      setResult(outcome);
    } catch {
      close();
    }
  };

  const next = () => {
    haptic.tap();
    if (inCards) {
      setStep(step + 1);
      return;
    }
    const nextAnswers = [...answers];
    nextAnswers[quizIndex] = picked;
    setAnswers(nextAnswers);
    setPicked(null);
    if (step + 1 >= totalSteps) finish(nextAnswers);
    else setStep(step + 1);
  };

  if (result) {
    const { result: quiz, xpEarned, firstTime, leveledUp, streak } = result;
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <Confetti />
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: "center", gap: space.sm }}>
          <Text style={{ fontSize: 88 }}>{quiz.passed ? "🏆" : "💪"}</Text>
          <Text variant="display" align="center">
            {quiz.passed ? "Lesson complete!" : "Nice try!"}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {quiz.correct} of {quiz.total} correct · {quiz.percent}%
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300)} style={[styles.statRow, { marginTop: space.xxl }]}>
          <Card tint={colors.accentSoft} borderColor="transparent" style={styles.stat}>
            <Text variant="label" color={colors.accentDark}>
              XP earned
            </Text>
            <Text variant="money">{firstTime ? `+${xpEarned}` : "Replay"}</Text>
          </Card>
          <Card tint={colors.streakSoft} borderColor="transparent" style={styles.stat}>
            <Text variant="label" color="#C2410C">
              Streak
            </Text>
            <Text variant="money">{streak.current} 🔥</Text>
          </Card>
        </Animated.View>
        {leveledUp ? (
          <Animated.View entering={FadeInUp.delay(500)} style={{ marginTop: space.lg }}>
            <Card tint={colors.primarySoft} borderColor="transparent">
              <Text variant="h3" tone="primary" align="center">
                ⭐ Level up! You’re now a {levelFor(result.state.kids.find((k) => k.id === kidId)?.xp ?? 0).title}
              </Text>
            </Card>
          </Animated.View>
        ) : null}
        <View style={{ marginTop: "auto", gap: space.sm }}>
          <Button title="Back to my path" size="lg" full onPress={close} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.flex}>
      <View style={styles.topBar}>
        <IconButton name="close" accessibilityLabel="Close lesson" onPress={close} />
        <View style={{ flex: 1 }}>
          <ProgressBar percent={((step + 1) / totalSteps) * 100} color={accent} height={14} />
        </View>
        <Text variant="captionStrong" tone="muted">
          {step + 1}/{totalSteps}
        </Text>
      </View>

      {inCards ? (
        <Animated.View key={`card-${step}`} entering={FadeInRight.duration(300)} style={[styles.flex, { marginTop: space.xl }]}>
          <View style={[styles.cardEmoji, { backgroundColor: `${accent}22`, borderRadius: radius.xxl }]}>
            <Text style={{ fontSize: 96 }}>{lesson.cards[step]?.emoji}</Text>
          </View>
          <Text variant="label" color={accent} style={{ marginTop: space.xl }}>
            {lesson.cards[step]?.kind === "story" ? "Story" : lesson.cards[step]?.kind === "fact" ? "Money fact" : lesson.cards[step]?.kind === "tip" ? "Tip" : "Try it"}
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {lesson.cards[step]?.title}
          </Text>
          <Text variant="body" tone="muted" style={{ marginTop: space.md, fontSize: 17, lineHeight: 26 }}>
            {lesson.cards[step]?.body}
          </Text>
        </Animated.View>
      ) : question ? (
        <Animated.View key={`q-${step}`} entering={FadeInRight.duration(300)} style={[styles.flex, { marginTop: space.xl }]}>
          <Text variant="label" color={accent}>
            Question {quizIndex + 1} of {lesson.quiz.length}
          </Text>
          <Text variant="h1" style={{ marginTop: 6 }}>
            {question.prompt}
          </Text>
          <View style={{ gap: space.md, marginTop: space.xl }}>
            {question.options.map((opt, i) => {
              const chosen = picked === i;
              const reveal = picked !== null;
              const correct = i === question.correctIndex;
              const bg = reveal && chosen ? (correct ? colors.successSoft : colors.dangerSoft) : reveal && correct ? colors.successSoft : colors.surface;
              const border = reveal && chosen ? (correct ? colors.success : colors.danger) : reveal && correct ? colors.success : colors.border;
              return (
                <Pressable
                  key={i}
                  disabled={reveal}
                  onPress={() => {
                    haptic.tap();
                    setPicked(i);
                    if (i === question.correctIndex) haptic.success();
                    else haptic.warning();
                  }}
                  style={({ pressed }) => [styles.option, { backgroundColor: bg, borderColor: border, borderRadius: radius.lg }, pressed && styles.pressed]}
                >
                  <View style={[styles.optionIndex, { backgroundColor: reveal && (chosen || correct) ? border : colors.bgAlt }]}>
                    {reveal && (chosen || correct) ? <Icon name={correct ? "checkmark" : "close"} size={16} color="#fff" /> : <Text variant="captionStrong">{String.fromCharCode(65 + i)}</Text>}
                  </View>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {picked !== null ? (
            <Animated.View entering={FadeInUp} style={{ marginTop: space.lg }}>
              <Card tint={picked === question.correctIndex ? colors.successSoft : colors.warningSoft} borderColor="transparent">
                <Text variant="bodyStrong">{picked === question.correctIndex ? "Correct! 🎉" : "Not quite."}</Text>
                <Text variant="caption" tone="muted">
                  {question.explanation}
                </Text>
              </Card>
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : null}

      <View style={{ marginTop: "auto", paddingTop: space.lg }}>
        <Button
          title={inCards ? (step === lesson.cards.length - 1 ? "Quiz time!" : "Next") : step + 1 >= totalSteps ? "Finish" : "Next question"}
          size="lg"
          full
          variant="custom"
          tint={accent}
          tintDark={shade(accent)}
          disabled={!inCards && picked === null}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

function shade(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "stretch", justifyContent: "center", paddingTop: 48 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardEmoji: { height: 200, alignItems: "center", justifyContent: "center" },
  option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 2 },
  optionIndex: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  pressed: { transform: [{ scale: 0.99 }] },
  statRow: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
});
