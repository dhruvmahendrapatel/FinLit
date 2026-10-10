import { addDays, CHORE_IDEAS, commands, rupees, toISODate, type ChoreRecurrence } from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Avatar, Button, Card, Chip, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { tryCommand } from "@/lib/errors";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const EMOJIS = ["🧹", "🛏️", "🪴", "🧺", "🍽️", "🛒", "📚", "🐶", "✏️", "🚗", "🗑️", "🧽"];
const REWARDS = [10, 20, 30, 50, 100];
type Due = "today" | "tomorrow" | "none";

export default function NewChore() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const kids = useFamilyState().kids;
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🧹");
  const [reward, setReward] = useState(20);
  const [custom, setCustom] = useState("");
  const [kidId, setKidId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<ChoreRecurrence>("once");
  const [due, setDue] = useState<Due>("today");
  const amount = custom ? Number(custom) : reward;

  const post = () => {
    const dueOn = due === "none" ? undefined : toISODate(addDays(new Date(), due === "tomorrow" ? 1 : 0));
    const ok = tryCommand(() =>
      dispatch((s, now) =>
        commands.postChore(s, { title, emoji, rewardPaise: rupees(amount), kidId, recurrence, ...(dueOn ? { dueOn } : {}) }, now),
      ),
    );
    if (ok) {
      toast({ title: "Chore posted", body: kidId ? `${kids.find((k) => k.id === kidId)?.name} will see it now` : "Any kid can claim it", emoji, tone: "success" });
      router.back();
    }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant="title">Post a chore</Text>
        <IconButton name="close" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      <Text variant="label" tone="muted" style={{ marginTop: space.lg }}>
        Ideas
      </Text>
      <View style={[styles.wrap, { marginTop: space.sm }]}>
        {CHORE_IDEAS.map((c) => (
          <Chip
            key={c.title}
            label={`${c.title} · ₹${c.rupees}`}
            emoji={c.emoji}
            selected={title === c.title}
            onPress={() => {
              setTitle(c.title);
              setEmoji(c.emoji);
              setReward(c.rupees);
              setCustom("");
              setRecurrence(c.recurrence);
            }}
          />
        ))}
      </View>

      <Card style={{ marginTop: space.xl }}>
        <View style={{ gap: space.lg }}>
          <View style={{ gap: 6 }}>
            <Text variant="label" tone="muted">
              What needs doing?
            </Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Water the plants" placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.semiBold, color: colors.text }]} />
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              Icon
            </Text>
            <View style={styles.wrap}>
              {EMOJIS.map((e) => (
                <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emoji, { backgroundColor: emoji === e ? colors.primarySoft : colors.bg, borderColor: emoji === e ? colors.primary : colors.border, borderRadius: radius.md }]}>
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              Reward
            </Text>
            <View style={styles.wrap}>
              {REWARDS.map((r) => (
                <Chip key={r} label={`₹${r}`} selected={!custom && reward === r} onPress={() => { setReward(r); setCustom(""); }} />
              ))}
              <TextInput value={custom} onChangeText={(v) => setCustom(v.replace(/\D/g, "").slice(0, 5))} placeholder="Other ₹" keyboardType="number-pad" placeholderTextColor={colors.textSoft} style={[styles.customInput, { backgroundColor: colors.bg, borderColor: custom ? colors.primary : colors.border, borderRadius: radius.pill, fontFamily: fontFamily.bold, color: colors.text }]} />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              Who can do it?
            </Text>
            <View style={styles.wrap}>
              <Chip label="Any kid" emoji="👧👦" selected={kidId === null} onPress={() => setKidId(null)} />
              {kids.map((k) => (
                <Chip key={k.id} label={k.name} selected={kidId === k.id} onPress={() => setKidId(k.id)} icon={<Avatar avatar={k.avatar} size={18} />} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              How often?
            </Text>
            <View style={styles.wrap}>
              {(["once", "daily", "weekly"] as ChoreRecurrence[]).map((r) => (
                <Chip key={r} label={r === "once" ? "Just once" : r === "daily" ? "Every day" : "Every week"} selected={recurrence === r} onPress={() => setRecurrence(r)} />
              ))}
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Text variant="label" tone="muted">
              Due
            </Text>
            <View style={styles.wrap}>
              {(["today", "tomorrow", "none"] as Due[]).map((d) => (
                <Chip key={d} label={d === "none" ? "Whenever" : d === "today" ? "Today" : "Tomorrow"} selected={due === d} onPress={() => setDue(d)} />
              ))}
            </View>
          </View>
        </View>
      </Card>

      <Button title={`Post for ₹${amount || 0}`} size="lg" full disabled={title.trim().length === 0 || !amount} onPress={post} style={{ marginTop: space.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  input: { height: 54, borderWidth: 1.5, fontSize: 16, paddingHorizontal: 16 },
  customInput: { height: 36, width: 96, borderWidth: 1.5, fontSize: 13, paddingHorizontal: 12, textAlign: "center" },
  emoji: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderWidth: 2 },
});
