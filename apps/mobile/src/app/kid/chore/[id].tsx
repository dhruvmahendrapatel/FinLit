import { commands } from "@finlit/core";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";

import { Button, Card, Chip, Icon, IconButton, Money, Screen, Text } from "@/components/ui";
import { useTheme } from "@/design";
import { useActiveKid } from "@/hooks/use-family";
import { tryCommand } from "@/lib/errors";
import { captureProofPhoto, type PhotoSource } from "@/lib/photo";
import { useDispatch, useFamilyState } from "@/store/family-store";
import { toast } from "@/store/toast-store";

const NOTES = ["Done!", "All clean ✨", "Took 10 minutes", "Check the photo 📸"];

/** "Mark done": attach a photo, add a note, send for approval. */
export default function SubmitChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, space, radius, fontFamily } = useTheme();
  const router = useRouter();
  const kid = useActiveKid();
  const chore = useFamilyState().chores.find((c) => c.id === id);
  const dispatch = useDispatch();
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("Done!");
  const [busy, setBusy] = useState(false);
  if (!chore || !kid) return null;

  const pick = async (source: PhotoSource) => {
    setBusy(true);
    const result = await captureProofPhoto(source);
    setBusy(false);
    if (result.status === "ok") setPhoto(result.uri);
    else if (result.status === "denied") toast({ title: "Camera permission needed", body: "Allow the camera in Settings, or choose from your gallery", emoji: "📷" });
  };

  const send = () => {
    const ok = tryCommand(() =>
      dispatch((s, now) => commands.submitChore(s, chore.id, kid.id, now, { note: note.trim() || "Done!", ...(photo ? { photoUri: photo } : {}) })),
    );
    if (ok) {
      toast({ title: "Sent for approval", body: photo ? "Photo attached. Money lands when your parents say yes" : "Money lands when your parents say yes", emoji: "📨", tone: "success" });
      router.back();
    }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Text variant="title">Mark done</Text>
        <IconButton name="close" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      <Card tint={colors.surfaceAlt} borderColor="transparent" style={{ marginTop: space.lg }}>
        <View style={styles.row}>
          <Text style={{ fontSize: 36 }}>{chore.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text variant="h3">{chore.title}</Text>
            <Text variant="caption" tone="muted">
              Your parents will check it and pay
            </Text>
          </View>
          <Money paise={chore.rewardPaise} variant="h3" tone="accent" />
        </View>
      </Card>

      <Text variant="h3" style={{ marginTop: space.xl }}>
        Show your work 📸
      </Text>
      <Text variant="caption" tone="muted">
        Optional, but photos get approved faster
      </Text>
      <View style={[styles.photoBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, marginTop: space.md }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" accessibilityLabel="Your proof photo" />
        ) : (
          <View style={styles.photoEmpty}>
            <Icon name="camera-outline" size={40} color={colors.textSoft} />
            <Text variant="caption" tone="soft">
              No photo yet
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.photoActions, { marginTop: space.md }]}>
        {Platform.OS !== "web" ? <Button title="Take a photo" variant="secondary" size="sm" loading={busy} icon={<Icon name="camera" size={18} color={colors.primaryDark} />} onPress={() => void pick("camera")} /> : null}
        <Button title={photo ? "Choose another" : "Choose from gallery"} variant="surface" size="sm" loading={busy} icon={<Icon name="images-outline" size={18} />} onPress={() => void pick("library")} />
        {photo ? <Button title="Remove" variant="ghost" size="sm" onPress={() => setPhoto(null)} /> : null}
      </View>

      <Text variant="h3" style={{ marginTop: space.xl }}>
        Add a note
      </Text>
      <View style={[styles.chips, { marginTop: space.sm }]}>
        {NOTES.map((n) => (
          <Chip key={n} label={n} selected={note === n} onPress={() => setNote(n)} />
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Anything your parents should know?"
        placeholderTextColor={colors.textSoft}
        maxLength={120}
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, fontFamily: fontFamily.semiBold, color: colors.text, marginTop: space.md }]}
      />

      <Button title="Send for approval" size="lg" full onPress={send} style={{ marginTop: space.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  photoBox: { height: 220, borderWidth: 1.5, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  photo: { width: "100%", height: "100%" },
  photoEmpty: { alignItems: "center", gap: 6 },
  photoActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { height: 50, borderWidth: 1.5, fontSize: 15, paddingHorizontal: 14 },
});
