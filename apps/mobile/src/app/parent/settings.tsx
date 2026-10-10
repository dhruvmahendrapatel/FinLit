import { commands, CONSENT_VERSION, type Language } from "@finlit/core";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Switch, TextInput, View } from "react-native";

import { Button, Card, Chip, Icon, IconButton, ListRow, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { tryCommand } from "@/lib/errors";
import { shareFamilyExport } from "@/lib/export";
import { requestReminderPermission } from "@/lib/reminders";
import { useDispatch, useFamilyState, useFamilyStore } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";
import { toast } from "@/store/toast-store";

const LIMITS = [10, 20, 30, 45];

export default function Settings() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const dispatch = useDispatch();
  const reset = useFamilyStore((s) => s.reset);
  const clearSession = useSessionStore((s) => s.clear);
  const [pin, setPin] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const version = (Constants.expoConfig?.version ?? "0.1.0") as string;

  const exportData = async () => {
    try {
      const outcome = await shareFamilyExport(state);
      if (outcome === "unavailable") toast({ title: "Sharing isn’t available on this device", emoji: "📦" });
      else toast({ title: outcome === "downloaded" ? "Export downloaded" : "Export ready to share", body: "A JSON copy of your family’s data, PIN redacted", emoji: "📦", tone: "success" });
    } catch {
      toast({ title: "Export failed", body: "Please try again", emoji: "😕", tone: "danger" });
    }
  };

  const toggleReminders = async (on: boolean) => {
    if (on && Platform.OS !== "web") {
      const granted = await requestReminderPermission();
      if (!granted) {
        toast({ title: "Notifications are off for Chillar", body: "Enable them in your phone’s settings to get reminders", emoji: "🔕" });
        return;
      }
    }
    dispatch((s) => commands.updateSettings(s, { remindersEnabled: on }));
    toast({ title: on ? "Reminders on" : "Reminders off", body: on ? "Allowance day, streak nudges and approvals" : undefined, emoji: on ? "🔔" : "🔕" });
  };

  const savePin = () => {
    if (tryCommand(() => dispatch((s) => commands.setParentPin(s, pin)))) {
      toast({ title: "PIN updated", emoji: "🔐", tone: "success" });
      setPin("");
    }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton name="chevron-back" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/parent/family"))} />
        <Text variant="title">Settings</Text>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Profile" emoji="🧑" />
        <Card padding={space.sm}>
          <ListRow emoji="🧑" leadingColor={colors.primarySoft} title={state.parent?.name ?? ""} subtitle={state.parent?.phoneMasked} last />
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Parent PIN" emoji="🔐" subtitle="4 digits. Protects approvals, allowance, offers and settings." />
        <Card>
          <View style={styles.pinRow}>
            <TextInput value={pin} onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))} placeholder="New PIN" keyboardType="number-pad" secureTextEntry maxLength={4} placeholderTextColor={colors.textSoft} style={[styles.pin, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.black, color: colors.text }]} />
            <Button title="Save" size="md" disabled={pin.length !== 4} onPress={savePin} />
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Kid mode" emoji="⏱️" />
        <Card>
          <Text variant="bodyStrong">Daily time limit</Text>
          <Text variant="caption" tone="muted">
            Chillar is built for 5–10 minutes a day. Kid mode shows a gentle stop after this.
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {LIMITS.map((m) => (
              <Chip key={m} label={`${m} min`} selected={state.settings.dailyKidMinutes === m} onPress={() => dispatch((s) => commands.updateSettings(s, { dailyKidMinutes: m }))} />
            ))}
          </View>
          <Text variant="bodyStrong" style={{ marginTop: space.lg }}>
            Lesson language
          </Text>
          <View style={[styles.wrap, { marginTop: space.sm }]}>
            {(["en", "hi"] as Language[]).map((l) => (
              <Chip key={l} label={l === "en" ? "English" : "हिन्दी (coming soon)"} selected={state.settings.language === l} onPress={() => dispatch((s) => commands.updateSettings(s, { language: l }))} />
            ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Reminders" emoji="🔔" />
        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Helpful nudges</Text>
              <Text variant="caption" tone="muted">
                Pocket-money day at 8am, a streak nudge at 6:30pm, and a reminder when chores wait for approval. Local only, nothing leaves the phone.
              </Text>
            </View>
            <Switch value={state.settings.remindersEnabled} onValueChange={(v) => void toggleReminders(v)} trackColor={{ true: colors.primary, false: colors.borderStrong }} thumbColor="#fff" />
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Privacy & consent" emoji="🛡️" subtitle={`Notice v${CONSENT_VERSION} · consent given ${state.consent ? new Date(state.consent.grantedAt).toLocaleDateString("en-IN") : "—"}`} />
        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Personalised ads on my screens</Text>
              <Text variant="caption" tone="muted">
                Kids never see personalised ads or share ad identifiers, whatever you choose here.
              </Text>
            </View>
            <Switch value={state.settings.parentAdConsent} onValueChange={(v) => dispatch((s) => commands.updateSettings(s, { parentAdConsent: v }))} trackColor={{ true: colors.primary, false: colors.borderStrong }} thumbColor="#fff" />
          </View>
          <View style={[styles.wrap, { marginTop: space.lg }]}>
            <Button title="Export my family’s data" variant="surface" size="sm" icon={<Icon name="download-outline" size={18} />} onPress={() => void exportData()} />
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xl }}>
        <SectionHeader title="Danger zone" emoji="⚠️" />
        {confirmDelete ? (
          <Card tint={colors.dangerSoft} borderColor="transparent">
            <Text variant="bodyStrong" tone="danger">
              Delete the whole family and every record?
            </Text>
            <Text variant="caption" tone="muted">
              Kids, jars, chores, goals and progress are erased from this device. This cannot be undone.
            </Text>
            <View style={[styles.wrap, { marginTop: space.md }]}>
              <Button title="Cancel" size="sm" variant="surface" onPress={() => setConfirmDelete(false)} />
              <Button
                title="Delete everything"
                size="sm"
                variant="danger"
                onPress={() => {
                  reset();
                  clearSession();
                  router.replace("/welcome");
                }}
              />
            </View>
          </Card>
        ) : (
          <Button title="Delete all family data" variant="ghost" size="sm" onPress={() => setConfirmDelete(true)} />
        )}
      </View>

      <Text variant="caption" tone="soft" align="center" style={{ marginTop: space.xxl }}>
        Chillar v{version} · Built for India’s DPDP Act · Made with 🪙 in Pune
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  pinRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  pin: { flex: 1, height: 52, borderWidth: 1.5, fontSize: 20, textAlign: "center", letterSpacing: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
