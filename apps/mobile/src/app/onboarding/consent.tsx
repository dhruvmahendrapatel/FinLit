import { CONSENT_SCOPE_INFO, commands, type ConsentScope } from "@finlit/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";

import { Button, Card, Chip, Icon, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { tryCommand } from "@/lib/errors";
import { useFamilyStore } from "@/store/family-store";
import { useOnboardingStore } from "@/store/onboarding-store";

const SCOPES = Object.keys(CONSENT_SCOPE_INFO) as ConsentScope[];

export default function OnboardingConsent() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const draft = useOnboardingStore();
  const dispatch = useFamilyStore((s) => s.dispatch);
  const [optional, setOptional] = useState<Set<ConsentScope>>(new Set());
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const pinOk = /^\d{4}$/.test(pin) && pin === confirm;

  const toggle = (scope: ConsentScope) =>
    setOptional((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });

  const create = () => {
    const ok = tryCommand(() =>
      dispatch((state, now) =>
        commands.setupFamily(
          state,
          {
            familyName: draft.familyName,
            city: draft.city,
            parentName: draft.parentName,
            phoneMasked: draft.phone,
            pin,
            consentMethod: "otp_demo",
            extraScopes: Array.from(optional),
          },
          now,
        ),
      ),
    );
    if (ok) router.replace("/onboarding/kids");
  };

  return (
    <Screen>
      <View style={{ gap: space.xl }}>
        <IconButton name="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <View style={{ gap: space.xs }}>
          <Text variant="caption" tone="primary">
            Step 2 of 3
          </Text>
          <Text variant="title">Your consent, your control</Text>
          <Text variant="body" tone="muted">
            Under India’s DPDP Act you are the data principal for your kids. Here is exactly what Chillar stores and why. You can export or delete it any time.
          </Text>
        </View>

        <View style={{ gap: space.sm }}>
          {SCOPES.map((scope) => {
            const info = CONSENT_SCOPE_INFO[scope];
            const on = info.required || optional.has(scope);
            return (
              <Card key={scope} padding={space.md}>
                <View style={styles.row}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.titleRow}>
                      <Text variant="bodyStrong">{info.title}</Text>
                      {info.required ? <Chip label="Required" size="sm" tone="neutral" /> : null}
                    </View>
                    <Text variant="caption" tone="muted">
                      {info.description}
                    </Text>
                  </View>
                  <Switch value={on} disabled={info.required} onValueChange={() => toggle(scope)} trackColor={{ true: colors.primary, false: colors.borderStrong }} thumbColor="#fff" />
                </View>
              </Card>
            );
          })}
        </View>

        <Card tint={colors.primarySoft} borderColor="transparent">
          <View style={styles.row}>
            <Icon name="shield-checkmark" size={26} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" tone="primary">
                Verify with DigiLocker
              </Text>
              <Text variant="caption" tone="muted">
                Verifiable parental consent (DPDP Rule 10) arrives with the pilot. The demo build records an OTP-style consent instead.
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ gap: space.sm }}>
          <Text variant="h3">Set a parent PIN</Text>
          <Text variant="caption" tone="muted">
            Kids can’t approve chores, change allowance or see offers without it.
          </Text>
          <View style={styles.pinRow}>
            <TextInput value={pin} onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))} placeholder="PIN" keyboardType="number-pad" secureTextEntry maxLength={4} placeholderTextColor={colors.textSoft} style={[styles.pin, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.black, color: colors.text }]} />
            <TextInput value={confirm} onChangeText={(v) => setConfirm(v.replace(/\D/g, "").slice(0, 4))} placeholder="Confirm" keyboardType="number-pad" secureTextEntry maxLength={4} placeholderTextColor={colors.textSoft} style={[styles.pin, { backgroundColor: colors.surface, borderColor: pin.length === 4 && confirm.length === 4 && pin !== confirm ? colors.danger : colors.border, borderRadius: radius.md, fontFamily: fontFamily.black, color: colors.text }]} />
          </View>
        </View>

        <Button title="Create our family" size="lg" full disabled={!pinOk} onPress={create} />
        <Pressable onPress={() => router.replace("/welcome")}>
          <Text variant="caption" tone="soft" align="center">
            By continuing you agree to the Chillar privacy notice (v2026-10).
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  pinRow: { flexDirection: "row", gap: 12 },
  pin: { flex: 1, height: 56, borderWidth: 1.5, fontSize: 22, textAlign: "center", letterSpacing: 8 },
});
