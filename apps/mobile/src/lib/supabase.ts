import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";

/**
 * Backend coordinates come from app.config.ts `extra` (env override → shipped default).
 * Setting EXPO_PUBLIC_SUPABASE_URL=off builds a fully on-device app with no cloud features.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseAnonKey?: string };
const url = extra.supabaseUrl && extra.supabaseUrl !== "off" ? extra.supabaseUrl : undefined;
const anonKey = url ? extra.supabaseAnonKey : undefined;

/**
 * Supabase client, or null when the build has no backend configured. Every cloud feature
 * checks `cloudEnabled` first so the app still runs fully on-device.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const cloudEnabled = supabase !== null;

// Refresh sessions and realtime only while the app is in the foreground.
if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
      if (!supabase.realtime.isConnected()) supabase.realtime.connect();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
