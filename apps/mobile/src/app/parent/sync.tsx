import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Avatar, Button, Card, Chip, Icon, IconButton, Screen, SectionHeader, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { cloudEnabled } from "@/lib/supabase";
import { createPairingCode, initSync, linkFamilyToCloud, signInWithPhone, signOut, verifyPhoneOtp } from "@/lib/sync";
import { useFamilyState } from "@/store/family-store";
import { useSyncStore } from "@/store/sync-store";
import { toast } from "@/store/toast-store";

/**
 * Cloud sync & kid devices. Parents sign in with phone OTP, upload the family once, then mint
 * pairing codes so each kid's own phone can join. Shows "not configured" until the build has a
 * backend (see supabase/README.md).
 */
export default function SyncScreen() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const state = useFamilyState();
  const sync = useSyncStore();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cloudEnabled) void initSync();
  }, []);

  const run = async (fn: () => Promise<void>, success?: string) => {
    setBusy(true);
    try {
      await fn();
      if (success) toast({ title: success, emoji: "☁️", tone: "success" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Something went wrong", emoji: "😕", tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  const signedOut = sync.status === "signed_out" || sync.status === "disabled";
  const linked = sync.status === "ready" || sync.status === "syncing" || sync.status === "error";

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton name="chevron-back" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/parent/family"))} />
        <Text variant="title">Cloud sync</Text>
      </View>
      <Text variant="body" tone="muted" style={{ marginTop: space.sm }}>
        Keep every phone in the family on the same page: your approvals show up on your kid’s device instantly, and their chores and lessons show up on yours.
      </Text>

      {!cloudEnabled ? (
        <Card tint={colors.infoSoft} borderColor="transparent" style={{ marginTop: space.xl }}>
          <View style={styles.row}>
            <Icon name="cloud-offline-outline" size={26} color="#1D6FB8" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Not configured in this build</Text>
              <Text variant="caption" tone="muted">
                Everything is stored on this phone. Cloud sync switches on once the app is built with a backend (see supabase/README.md).
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {cloudEnabled && signedOut ? (
        <Card style={{ marginTop: space.xl }}>
          <Text variant="h3">Sign in with your mobile number</Text>
          <Text variant="caption" tone="muted">
            We’ll text you a one-time code. Use the same number on every parent phone.
          </Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" editable={!otpSent} placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.semiBold, color: colors.text, marginTop: space.md }]} />
          {otpSent ? (
            <TextInput value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" keyboardType="number-pad" placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.black, color: colors.text, marginTop: space.sm, letterSpacing: 6 }]} />
          ) : null}
          <View style={[styles.actions, { marginTop: space.md }]}>
            {otpSent ? (
              <>
                <Button title="Change number" variant="ghost" size="sm" onPress={() => setOtpSent(false)} />
                <Button title="Verify" size="sm" loading={busy} disabled={otp.length !== 6} onPress={() => void run(() => verifyPhoneOtp(phone, otp), "Signed in")} />
              </>
            ) : (
              <Button title="Send code" size="sm" loading={busy} disabled={phone.replace(/\D/g, "").length < 10} onPress={() => void run(() => signInWithPhone(phone).then(() => setOtpSent(true)))} />
            )}
          </View>
        </Card>
      ) : null}

      {cloudEnabled && sync.status === "unlinked" ? (
        <Card style={{ marginTop: space.xl }}>
          <Text variant="h3">Upload this family</Text>
          <Text variant="caption" tone="muted">
            Creates {state.family?.name ?? "your family"} in the cloud with everything on this phone. Do this once, from the parent’s phone.
          </Text>
          <Button title="Upload and start syncing" size="md" loading={busy} onPress={() => void run(() => linkFamilyToCloud().then(() => undefined), "Family is in the cloud")} style={{ marginTop: space.md }} />
        </Card>
      ) : null}

      {cloudEnabled && linked ? (
        <>
          <Card tint={sync.status === "error" ? colors.dangerSoft : colors.successSoft} borderColor="transparent" style={{ marginTop: space.xl }}>
            <View style={styles.row}>
              <Icon name={sync.status === "error" ? "cloud-offline-outline" : "cloud-done-outline"} size={26} color={sync.status === "error" ? colors.danger : "#15803D"} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{sync.status === "error" ? "Sync problem" : sync.status === "syncing" ? "Syncing…" : "Synced"}</Text>
                <Text variant="caption" tone="muted">
                  {sync.status === "error" ? sync.error : `Revision ${sync.revision}${sync.lastSyncedAt ? ` · ${new Date(sync.lastSyncedAt).toLocaleTimeString("en-IN")}` : ""}`}
                </Text>
              </View>
              <Chip label={sync.role === "kid" ? "Kid device" : "Parent"} size="sm" tone="primary" />
            </View>
          </Card>

          {sync.role === "parent" ? (
            <View style={{ marginTop: space.xl }}>
              <SectionHeader title="Kid devices" emoji="📱" subtitle="Generate a code, then open Chillar Kids on their phone and tap “Join with a code”. Codes last 15 minutes." />
              <Card padding={space.sm}>
                {state.kids.map((k, i) => (
                  <View key={k.id} style={[styles.kidRow, { paddingVertical: space.md, borderBottomWidth: i === state.kids.length - 1 ? 0 : 1, borderBottomColor: colors.border }]}>
                    <Avatar avatar={k.avatar} size={40} />
                    <Text variant="bodyStrong" style={{ flex: 1 }}>
                      {k.name}
                    </Text>
                    {codes[k.id] ? (
                      <Text style={{ fontFamily: fontFamily.black, fontSize: 22, letterSpacing: 4, color: colors.primary }}>{codes[k.id]}</Text>
                    ) : (
                      <Button title="Get code" size="sm" variant="secondary" loading={busy} onPress={() => void run(() => createPairingCode(k.id).then((code) => setCodes((c) => ({ ...c, [k.id]: code }))))} />
                    )}
                  </View>
                ))}
              </Card>
            </View>
          ) : null}

          <Button title="Sign out of cloud sync" variant="ghost" size="sm" onPress={() => void run(() => signOut(), "Signed out")} style={{ marginTop: space.xl }} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  input: { height: 52, borderWidth: 1.5, fontSize: 16, paddingHorizontal: 14 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },
  kidRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
