import { AVATARS, commands, rupees, type AvatarId } from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";

import { UpsellCard } from "@/components/monetization";
import { Avatar, Button, Card, Chip, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useEntitlements } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { useFamilyState, useFamilyStore } from "@/store/family-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { toast } from "@/store/toast-store";

const AGES = Array.from({ length: 13 }, (_, i) => i + 5);
const ALLOWANCES = [50, 100, 150, 200, 300];
const AVATAR_IDS = Object.keys(AVATARS) as AvatarId[];

/** Add kids. Used in onboarding (step 3) and from Parent › Family › Add a kid. */
export function AddKidsFlow({ onDone, stepLabel }: { onDone: "/who" | "/parent/family"; stepLabel?: string }) {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const dispatch = useFamilyStore((s) => s.dispatch);
  const kids = useFamilyState().kids;
  const ent = useEntitlements();
  const resetDraft = useOnboardingStore((s) => s.reset);
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [avatar, setAvatar] = useState<AvatarId>("tiger");
  const [allowance, setAllowance] = useState(100);
  const [interest, setInterest] = useState(true);
  const limitReached = kids.length >= ent.maxKids;

  const add = () => {
    const ok = tryCommand(() =>
      dispatch((state, now) =>
        commands.addKid(
          state,
          {
            name,
            age,
            avatar,
            allowance: { amountPaise: rupees(allowance), cadence: "weekly", weekday: 0 },
            interestRatePercent: interest ? 12 : 0,
          },
          now,
        ),
      ),
    );
    if (ok) {
      toast({ title: `${name.trim()} is in!`, body: `₹${allowance} every Sunday, split into four jars`, emoji: AVATARS[avatar].emoji, tone: "success" });
      setName("");
      setAvatar(AVATAR_IDS[(AVATAR_IDS.indexOf(avatar) + 1) % AVATAR_IDS.length] ?? "tiger");
    }
  };

  return (
    <Screen>
      <View style={{ gap: space.xl }}>
        <View style={{ gap: space.xs }}>
          {stepLabel ? (
            <Text variant="caption" tone="primary">
              {stepLabel}
            </Text>
          ) : null}
          <Text variant="title">Add your kids</Text>
          <Text variant="body" tone="muted">
            Each kid gets an avatar, four jars and lessons for their age. Free covers two kids.
          </Text>
        </View>

        {kids.length > 0 ? (
          <View style={styles.kidRow}>
            {kids.map((k) => (
              <View key={k.id} style={{ alignItems: "center", gap: 4 }}>
                <Avatar avatar={k.avatar} size={56} />
                <Text variant="captionStrong">{k.name}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {limitReached ? (
          <UpsellCard feature="unlimited_kids" headline="Add a third kid with Family Premium" />
        ) : (
          <Card>
            <View style={{ gap: space.lg }}>
              <View style={{ gap: 6 }}>
                <Text variant="label" tone="muted">
                  Name
                </Text>
                <TextInput value={name} onChangeText={setName} placeholder="Aarav" placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.semiBold, color: colors.text }]} />
              </View>

              <View style={{ gap: 8 }}>
                <Text variant="label" tone="muted">
                  Age
                </Text>
                <View style={styles.wrap}>
                  {AGES.map((a) => (
                    <Chip key={a} label={String(a)} selected={a === age} onPress={() => setAge(a)} />
                  ))}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text variant="label" tone="muted">
                  Pick a buddy
                </Text>
                <View style={styles.wrap}>
                  {AVATAR_IDS.map((id) => (
                    <Pressable key={id} onPress={() => setAvatar(id)} accessibilityLabel={AVATARS[id].name} style={[styles.avatarPick, avatar === id && { borderColor: colors.primary }]}>
                      <Avatar avatar={id} size={48} />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text variant="label" tone="muted">
                  Weekly pocket money
                </Text>
                <View style={styles.wrap}>
                  {ALLOWANCES.map((a) => (
                    <Chip key={a} label={`₹${a}`} selected={a === allowance} onPress={() => setAllowance(a)} />
                  ))}
                </View>
                <Text variant="caption" tone="soft">
                  Paid every Sunday · 40% Spend · 40% Save · 10% Share · 10% Grow. Change any time.
                </Text>
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Bank of Mum & Dad interest</Text>
                  <Text variant="caption" tone="muted">
                    You pay 12% a year (1% a month) on the Save jar so they watch compounding happen
                  </Text>
                </View>
                <Switch value={interest} onValueChange={setInterest} trackColor={{ true: colors.primary, false: colors.borderStrong }} thumbColor="#fff" />
              </View>

              <Button title={`Add ${name.trim() || "kid"}`} full disabled={name.trim().length === 0} onPress={add} />
            </View>
          </Card>
        )}

        <Button
          title={kids.length === 0 ? "Skip for now" : "Done"}
          variant={kids.length === 0 ? "ghost" : "secondary"}
          size="lg"
          full
          onPress={() => {
            resetDraft();
            router.replace(onDone);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { height: 54, borderWidth: 1.5, fontSize: 16, paddingHorizontal: 16 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarPick: { borderWidth: 3, borderColor: "transparent", borderRadius: 30, padding: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  kidRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
});
