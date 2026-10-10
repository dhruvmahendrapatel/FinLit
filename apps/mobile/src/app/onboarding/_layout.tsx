import { Stack } from "expo-router";

import { kidTheme, ThemeProvider } from "@/design";

export default function OnboardingLayout() {
  return (
    <ThemeProvider mode="kid">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: kidTheme.colors.bg } }} />
    </ThemeProvider>
  );
}
