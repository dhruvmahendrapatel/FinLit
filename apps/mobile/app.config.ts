import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * One codebase, three distributable variants (see docs/architecture.md):
 *  - family  : combined dev/demo build with both experiences behind a PIN gate
 *  - parent  : Parent app (account holder, consent, approvals, premium, ads allowed)
 *  - kid     : Kid app (Google Play Families / contextual-only ads, no ad IDs)
 */
type Variant = "family" | "parent" | "kid";
const variant = (process.env.APP_VARIANT as Variant | undefined) ?? "family";

/**
 * Backend coordinates. The publishable key is safe to ship (row-level security guards every row);
 * override per environment with EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY, or set the URL to "off"
 * to build without any cloud features.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://fgrlwxzpmeffljphhmqb.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_hhXVijB_cORN-mGll2WzNg_TvUSM6yq";

const names: Record<Variant, string> = {
  family: "Chillar",
  parent: "Chillar for Parents",
  kid: "Chillar Kids",
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: names[variant],
  slug: "chillar",
  scheme: "chillar",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: `app.chillar.${variant}`,
    supportsTablet: false,
  },
  android: {
    package: `app.chillar.${variant}`,
    adaptiveIcon: {
      backgroundColor: "#5B4DFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        cameraPermission: "Chillar uses the camera so kids can show a finished chore.",
        photosPermission: "Chillar uses your photos so kids can attach a picture of a finished chore.",
      },
    ],
    "expo-sharing",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#5B4DFF",
        defaultChannel: "reminders",
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#5B4DFF",
        image: "./assets/images/splash-icon.png",
        imageWidth: 120,
      },
    ],
  ],
  extra: {
    appVariant: variant,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
