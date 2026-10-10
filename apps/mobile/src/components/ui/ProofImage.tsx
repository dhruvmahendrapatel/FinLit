import { Image, type ImageProps } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

import { Icon } from "./Icon";
import { Text } from "./Text";
import { useTheme } from "@/design";
import { isRemoteProof, resolveProofUri } from "@/lib/storage";

export interface ProofImageProps {
  /** Local file URI or `supabase://chore-proofs/...` reference. */
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageProps["contentFit"];
  accessibilityLabel: string;
}

/** Renders a chore proof photo, resolving cloud references to signed URLs. */
export function ProofImage({ uri, style, contentFit = "cover", accessibilityLabel }: ProofImageProps) {
  const { colors } = useTheme();
  const boxStyle = style as StyleProp<ViewStyle>;
  const remote = isRemoteProof(uri);
  const [resolved, setResolved] = useState<string | null>(remote ? null : uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!remote) return;
    let alive = true;
    resolveProofUri(uri).then(
      (url) => {
        if (!alive) return;
        if (url) setResolved(url);
        else setFailed(true);
      },
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [uri, remote]);

  if (failed) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt }, boxStyle]} accessibilityLabel={accessibilityLabel}>
        <Icon name="cloud-offline-outline" size={22} color={colors.textSoft} />
        <Text variant="caption" tone="soft">
          Photo is in the cloud; connect to view
        </Text>
      </View>
    );
  }
  if (!resolved) {
    return <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt }, boxStyle]} accessibilityLabel={accessibilityLabel} />;
  }
  return <Image source={{ uri: resolved }} style={style} contentFit={contentFit} accessibilityLabel={accessibilityLabel} />;
}

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden" },
});
