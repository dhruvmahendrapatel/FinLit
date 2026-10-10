import { Redirect, Stack } from "expo-router";

import { kidTheme, ThemeProvider } from "@/design";
import { useFamilyStore } from "@/store/family-store";

export default function KidLayout() {
  const hasKids = useFamilyStore((s) => s.state.kids.length > 0);
  const hydrated = useFamilyStore((s) => s.hydrated);
  if (hydrated && !hasKids) return <Redirect href="/welcome" />;
  return (
    <ThemeProvider mode="kid">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: kidTheme.colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="goal/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="goal/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="jar/[jar]" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
