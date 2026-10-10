import type { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTheme } from "@/design";

export interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default) or a fixed layout */
  scroll?: boolean;
  padded?: boolean;
  bg?: string;
  edges?: Edge[];
  /** Extra bottom padding so content clears a floating tab bar */
  tabBarInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Fixed header rendered above the scroll area */
  header?: ReactNode;
  testID?: string;
}

/** Phone-width column on web so the app reads like a device even in a desktop browser. */
export const MAX_CONTENT_WIDTH = 520;

export function Screen({
  children,
  scroll = true,
  padded = true,
  bg,
  edges = ["top", "left", "right"],
  tabBarInset = false,
  contentStyle,
  style,
  header,
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? theme.space.lg : 0;
  const bottom = tabBarInset ? 112 : theme.space.xxl;
  const column: ViewStyle = Platform.OS === "web" ? { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" } : {};

  return (
    <SafeAreaView testID={testID} edges={edges} style={[styles.root, { backgroundColor: bg ?? theme.colors.bg }, style]}>
      {header ? <View style={column}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={[{ paddingHorizontal: padding, paddingTop: padding, paddingBottom: bottom }, column, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, { paddingHorizontal: padding, paddingTop: padding, paddingBottom: bottom }, column, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
