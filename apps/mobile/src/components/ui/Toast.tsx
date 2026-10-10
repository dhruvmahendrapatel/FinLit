import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "./Text";
import { useTheme } from "@/design";
import { useToastStore, type ToastMessage } from "@/store/toast-store";

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { colors, radius, shadow } = useTheme();
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), 3200);
    return () => clearTimeout(id);
  }, [toast.id, dismiss]);
  const tones = {
    default: { bg: "#1B1B3A", fg: "#FFFFFF" },
    success: { bg: "#15803D", fg: "#FFFFFF" },
    premium: { bg: colors.premium, fg: "#3A2A00" },
    danger: { bg: colors.danger, fg: "#FFFFFF" },
  } as const;
  const t = tones[toast.tone ?? "default"];
  return (
    <Animated.View entering={FadeInUp.springify().damping(16)} exiting={FadeOutUp}>
      <Pressable onPress={() => dismiss(toast.id)} style={[styles.toast, { backgroundColor: t.bg, borderRadius: radius.lg }, shadow.float]}>
        {toast.emoji ? <Text style={styles.emoji}>{toast.emoji}</Text> : null}
        <View style={styles.text}>
          <Text variant="bodyStrong" color={t.fg}>
            {toast.title}
          </Text>
          {toast.body ? (
            <Text variant="caption" color={t.fg} style={{ opacity: 0.85 }}>
              {toast.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Mount once near the root; shows the toast queue at the top of the screen. */
export function ToastHost() {
  const queue = useToastStore((s) => s.queue);
  const insets = useSafeAreaInsets();
  if (queue.length === 0) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + (Platform.OS === "web" ? 12 : 6) }]}>
      {queue.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 16, right: 16, gap: 8, alignItems: "center", zIndex: 1000 },
  toast: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, maxWidth: 480, width: "100%" },
  emoji: { fontSize: 24 },
  text: { flex: 1 },
});
