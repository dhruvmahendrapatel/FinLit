import type { Href } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from "expo-router/ui";
import { forwardRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, Text, type IconName } from "@/components/ui";
import { MAX_CONTENT_WIDTH } from "@/components/ui/Screen";
import { useTheme } from "@/design";
import { haptic } from "@/lib/haptics";

export interface TabSpec {
  name: string;
  href: Href;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  badge?: number;
}

/**
 * Headless expo-router tabs with our own bar, so kid and parent experiences can look
 * different (floating pill for kids, flat bar for parents) while sharing one component.
 */
export function AppTabs({ tabs }: { tabs: TabSpec[] }) {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      {/* TabTriggers must be direct children of TabList so the navigator can register its screens. */}
      <TabList asChild>
        <BarContainer>
          {tabs.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton spec={tab} />
            </TabTrigger>
          ))}
        </BarContainer>
      </TabList>
    </Tabs>
  );
}

/** The visual bar: floating pill for kids, flat card for parents. Receives the triggers as children. */
const BarContainer = forwardRef<View, TabListProps>(function BarContainer({ children, style: _style, ...props }, ref) {
  const { colors, radius, shadow, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const kid = mode === "kid";
  return (
    <View ref={ref} {...props} pointerEvents="box-none" style={[styles.listWrap, { paddingBottom: Math.max(insets.bottom, kid ? 14 : 8) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.border,
            borderRadius: kid ? radius.xxl : radius.lg,
            marginHorizontal: kid ? 16 : 10,
          },
          shadow.raised,
        ]}
      >
        {children}
      </View>
    </View>
  );
});

const TabButton = forwardRef<View, TabTriggerSlotProps & { spec: TabSpec }>(function TabButton({ spec, isFocused, onPress, ...props }, ref) {
  const { colors, fontFamily, mode, radius } = useTheme();
  const kid = mode === "kid";
  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      onPress={(e) => {
        haptic.tap();
        onPress?.(e);
      }}
      style={styles.tab}
    >
      <View
        style={[
          styles.iconWrap,
          kid && isFocused && { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 16 },
        ]}
      >
        <Icon name={isFocused ? spec.activeIcon : spec.icon} size={kid ? 26 : 24} color={isFocused ? colors.tabActive : colors.tabInactive} />
        {spec.badge ? (
          <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.tabBar }]}>
            <Text style={{ fontFamily: fontFamily.black, fontSize: 10, color: "#fff", lineHeight: 12 }}>{spec.badge > 9 ? "9+" : spec.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: isFocused ? fontFamily.extraBold : fontFamily.bold,
          fontSize: 11,
          lineHeight: 14,
          color: isFocused ? colors.tabActive : colors.tabInactive,
        }}
      >
        {spec.label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  slot: { flex: 1 },
  listWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    width: Platform.OS === "web" ? "100%" : undefined,
    alignSelf: "stretch",
    maxWidth: MAX_CONTENT_WIDTH - 32,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 },
  iconWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 3, position: "relative" },
  badge: {
    position: "absolute",
    top: -2,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
