import { isOnboarded } from "@finlit/core";
import { Redirect, Stack, usePathname } from "expo-router";

import { parentTheme, ThemeProvider } from "@/design";
import { useFamilyStore } from "@/store/family-store";
import { useSessionStore } from "@/store/session-store";

/** Everything under /parent sits behind the PIN gate. */
export default function ParentLayout() {
  const hydrated = useFamilyStore((s) => s.hydrated);
  const onboarded = useFamilyStore((s) => isOnboarded(s.state));
  const isUnlocked = useSessionStore((s) => s.isParentUnlocked);
  const pathname = usePathname();

  if (hydrated && !onboarded) return <Redirect href="/welcome" />;
  if (hydrated && !isUnlocked()) return <Redirect href={{ pathname: "/pin", params: { next: pathname } }} />;

  return (
    <ThemeProvider mode="parent">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: parentTheme.colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="kid/[id]" />
        <Stack.Screen name="chore/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="premium" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="guide/[id]" />
        <Stack.Screen name="add-kid" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
