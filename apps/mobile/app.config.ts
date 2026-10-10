import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * One codebase, three distributable variants (see docs/architecture.md):
 *  - family  : combined dev/demo build with both experiences behind a PIN gate
 *  - parent  : Parent app (account holder, consent, approvals, premium, ads allowed)
 *  - kid     : Kid app (Google Play Families / contextual-only ads, no ad IDs)
 */
type Variant = "family" | "parent" | "kid";
const variant = (process.env.APP_VARIANT as Variant | undefined) ?? "family";

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
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
