import type { Chore, Kid } from "@finlit/core";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { Avatar, Button, Card, Money, Text } from "@/components/ui";
import { useTheme } from "@/design";

export interface ApprovalCardProps {
  chore: Chore;
  kid: Kid | undefined;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalCard({ chore, kid, onApprove, onReject }: ApprovalCardProps) {
  const { colors, space, radius } = useTheme();
  return (
    <Card tint={colors.warningSoft} borderColor="transparent">
      <View style={styles.row}>
        {kid ? <Avatar avatar={kid.avatar} size={44} /> : null}
        <View style={styles.text}>
          <Text variant="bodyStrong">
            {kid?.name ?? "Someone"} finished “{chore.title}”
          </Text>
          {chore.proofNote ? (
            <Text variant="caption" tone="muted">
              “{chore.proofNote}”
            </Text>
          ) : null}
        </View>
        <View style={[styles.reward, { backgroundColor: colors.surface, borderRadius: radius.pill }]}>
          <Money paise={chore.rewardPaise} variant="captionStrong" />
        </View>
      </View>
      {chore.proofPhotoUri ? (
        <Image source={{ uri: chore.proofPhotoUri }} style={[styles.proof, { borderRadius: radius.lg, marginTop: space.md }]} contentFit="cover" accessibilityLabel={`${kid?.name ?? "Kid"}'s proof photo`} />
      ) : null}
      <View style={[styles.actions, { marginTop: space.md }]}>
        <Button title="Not yet" variant="surface" size="sm" onPress={onReject} />
        <Button title={`Approve · ₹${Math.round(chore.rewardPaise / 100)}`} size="sm" onPress={onApprove} style={styles.grow} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1, gap: 2 },
  reward: { paddingHorizontal: 10, paddingVertical: 6 },
  proof: { width: "100%", height: 180 },
  actions: { flexDirection: "row", gap: 8 },
  grow: { flexGrow: 1 },
});
