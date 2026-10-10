import { commands } from "@finlit/core";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastHost } from "@/components/ui";
import { fontAssets, kidTheme, ThemeProvider } from "@/design";
import { configureNotifications, syncReminders } from "@/lib/reminders";
import { initSync } from "@/lib/sync";
import { useFamilyStore } from "@/store/family-store";
import { toast } from "@/store/toast-store";

SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const hydrated = useFamilyStore((s) => s.hydrated);
  const dispatch = useFamilyStore((s) => s.dispatch);
  const jobsRan = useRef(false);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hydrated) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, hydrated]);

  // Pay due allowances and monthly interest once per launch.
  useEffect(() => {
    if (!hydrated || jobsRan.current) return;
    jobsRan.current = true;
    void initSync();
    const result = dispatch(commands.runScheduledJobs);
    if (result.allowancesPaid.length > 0) {
      toast({ title: "Pocket money paid!", body: "Allowance landed in the jars", emoji: "💸", tone: "success" });
    }
    if (result.interestAccrued.length > 0) {
      toast({ title: "Interest day 🏦", body: "Bank of Mum & Dad paid interest on Save jars", emoji: "📈" });
    }
  }, [hydrated, dispatch]);

  // Keep local reminders in step with the family's state (debounced).
  const state = useFamilyStore((s) => s.state);
  useEffect(() => {
    if (!hydrated) return undefined;
    const id = setTimeout(() => {
      syncReminders(state).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(id);
  }, [hydrated, state]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider mode="kid">
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: kidTheme.colors.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="who" />
            <Stack.Screen name="join" />
            <Stack.Screen name="pin" options={{ presentation: "modal" }} />
            <Stack.Screen name="kid" />
            <Stack.Screen name="parent" />
          </Stack>
          <ToastHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
