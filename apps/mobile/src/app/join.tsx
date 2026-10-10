import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Button, Card, Icon, IconButton, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { cloudEnabled } from "@/lib/supabase";
import { joinWithPairingCode } from "@/lib/sync";
import { toast } from "@/store/toast-store";

/** Kid device: join the family with the 6-digit code a parent generated. */
export default function Join() {
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setBusy(true);
    try {
      await joinWithPairingCode(code);
      toast({ title: "You’re in!", body: "Your jars and chores are ready", emoji: "🎉", tone: "success" });
      router.replace("/kid");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Couldn’t join", emoji: "😕", tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <IconButton name="chevron-back" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))} />
      <View style={{ alignItems: "center", gap: space.sm, marginTop: space.xl }}>
        <Text style={{ fontSize: 64 }}>🔗</Text>
        <Text variant="title" align="center">
          Join your family
        </Text>
        <Text variant="body" tone="muted" align="center">
          Ask a parent to open Chillar › Family › Cloud sync and tap “Get code” next to your name.
        </Text>
      </View>
      {cloudEnabled ? (
        <Card style={{ marginTop: space.xxl }}>
          <TextInput value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" keyboardType="number-pad" placeholderTextColor={colors.textSoft} style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.black, color: colors.text }]} />
          <Button title="Join" size="lg" full loading={busy} disabled={code.length !== 6} onPress={() => void join()} style={{ marginTop: space.md }} />
        </Card>
      ) : (
        <Card tint={colors.infoSoft} borderColor="transparent" style={{ marginTop: space.xxl }}>
          <View style={styles.row}>
            <Icon name="cloud-offline-outline" size={26} color="#1D6FB8" />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              This build has no cloud backend yet, so kid devices can’t join remotely. Use the same phone and pick your profile instead.
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { height: 60, borderWidth: 1.5, fontSize: 28, textAlign: "center", letterSpacing: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
