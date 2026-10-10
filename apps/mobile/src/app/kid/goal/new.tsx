import { commands, GOAL_IDEAS, rupees } from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Button, Card, Chip, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { useDispatch } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const EMOJIS = ["🏏", "🚲", "🧱", "🎨", "⚽", "📚", "🎲", "🎧", "🎮", "🧸", "👟", "🎸"];

export default function NewGoal() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🏏");
  const [amount, setAmount] = useState("");
  const target = Number(amount.replace(/\D/g, ""));
  const canSave = !!kid && title.trim().length > 0 && target > 0;

  const save = () => {
    if (!kid) return;
    const ok = tryCommand(() => dispatch((s, now) => commands.createGoal(s, { kidId: kid.id, title, emoji, targetPaise: rupees(target), parentMatchPercent: 0 }, now)));
    if (ok) {
      toast({ title: "Goal created!", body: "Ask your parents if they'll match your savings", emoji, tone: "success" });
      router.back();
    }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant="title">New goal</Text>
        <IconButton name="close" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>
      <Text variant="body" tone="muted">
        What are you saving for?
      </Text>

      <View style={[styles.ideas, { marginTop: space.lg }]}>
        {GOAL_IDEAS.map((g) => (
          <Chip
            key={g.title}
            label={`${g.title} · ₹${g.rupees}`}
            emoji={g.emoji}
            selected={title === g.title}
            onPress={() => {
              setTitle(g.title);
              setEmoji(g.emoji);
              setAmount(String(g.rupees));
            }}
          />
        ))}
      </View>

      <Card style={{ marginTop: space.xl }}>
        <View style={{ gap: space.lg }}>
          <View style={{ gap: 6 }}>
            <Text variant="label" tone="muted">
              Goal name
            </Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Cricket bat" placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.semiBold, color: colors.text }]} />
          </View>
          <View style={{ gap: 6 }}>
            <Text variant="label" tone="muted">
              How much? (₹)
            </Text>
            <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="2499" placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.black, color: colors.text, fontSize: 22 }]} />
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              Pick an icon
            </Text>
            <View style={styles.emojis}>
              {EMOJIS.map((e) => (
                <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emoji, { backgroundColor: emoji === e ? colors.primarySoft : colors.bg, borderColor: emoji === e ? colors.primary : colors.border, borderRadius: radius.md }]}>
                  <Text style={{ fontSize: 26 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Card>

      <Button title="Start saving" size="lg" full disabled={!canSave} onPress={save} style={{ marginTop: space.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ideas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { height: 54, borderWidth: 1.5, fontSize: 16, paddingHorizontal: 16 },
  emojis: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emoji: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 2 },
});
