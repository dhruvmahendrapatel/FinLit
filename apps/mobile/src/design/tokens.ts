import type { JarKind } from "@finlit/core";
import { Platform, type TextStyle, type ViewStyle } from "react-native";

/** Raw palette. Screens use the semantic Theme, not these directly. */
export const palette = {
  violet: {
    50: "#F3F1FF",
    100: "#E8E4FF",
    200: "#D2CBFF",
    300: "#B3A7FF",
    400: "#8E7DFF",
    500: "#5B4DFF",
    600: "#4A3BE6",
    700: "#3B2EC2",
    800: "#2E2496",
    900: "#221B6E",
  },
  gold: { 100: "#FFF4D1", 300: "#FFE08A", 400: "#FFD054", 500: "#FFC233", 600: "#E6A900", 700: "#B88400" },
  coral: { 100: "#FFE4E4", 400: "#FF8A8A", 500: "#FF6B6B", 600: "#E65252" },
  teal: { 100: "#D8F7F2", 400: "#2DD4BF", 500: "#14B8A6", 600: "#0F9688" },
  pink: { 100: "#FCE1EF", 400: "#F472B6", 500: "#EC4899", 600: "#D1337F" },
  grape: { 100: "#EDE4FF", 400: "#A78BFA", 500: "#8B5CF6", 600: "#7444E3" },
  green: { 100: "#DCFCE7", 500: "#22C55E", 600: "#16A34A" },
  sky: { 100: "#E0F1FF", 500: "#3DA9FC", 600: "#2B8FE0" },
  orange: { 100: "#FFE8D6", 500: "#FB923C", 600: "#EA7A22" },
  red: { 100: "#FEE4E2", 500: "#F04438", 600: "#D92D20" },
  ink: {
    900: "#1B1B3A",
    800: "#2A2A4A",
    700: "#3A3A5C",
    500: "#6B6B8A",
    400: "#8A8AA6",
    300: "#A9A9C2",
    200: "#D6D6E4",
    100: "#ECECF4",
    50: "#F7F7FB",
  },
  white: "#FFFFFF",
  cream: "#FFF8EE",
  creamDeep: "#FFEFD6",
} as const;

export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, xxl: 36, pill: 999 } as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Font family names as registered by expo-font (see design/fonts.ts). */
export const fontFamily = {
  display: "Baloo2_800ExtraBold",
  displayBold: "Baloo2_700Bold",
  displayMedium: "Baloo2_600SemiBold",
  black: "Nunito_900Black",
  extraBold: "Nunito_800ExtraBold",
  bold: "Nunito_700Bold",
  semiBold: "Nunito_600SemiBold",
  regular: "Nunito_400Regular",
} as const;

export type ThemeMode = "kid" | "parent";

export interface JarPalette {
  main: string;
  dark: string;
  soft: string;
}

export interface ThemeColors {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textSoft: string;
  textOnPrimary: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  border: string;
  borderStrong: string;
  premium: string;
  premiumDark: string;
  premiumSoft: string;
  streak: string;
  streakSoft: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  overlay: string;
  jars: Record<JarKind, JarPalette>;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  radius: typeof radius;
  space: typeof space;
  fontFamily: typeof fontFamily;
  /** Headline family: playful Baloo for kids, confident Nunito for parents */
  headingFamily: string;
  shadow: { card: ViewStyle; raised: ViewStyle; float: ViewStyle };
}

const jars: Record<JarKind, JarPalette> = {
  spend: { main: palette.coral[500], dark: palette.coral[600], soft: palette.coral[100] },
  save: { main: palette.teal[500], dark: palette.teal[600], soft: palette.teal[100] },
  share: { main: palette.pink[500], dark: palette.pink[600], soft: palette.pink[100] },
  invest: { main: palette.grape[500], dark: palette.grape[600], soft: palette.grape[100] },
};

function shadow(elevation: number, opacity: number, radiusPx: number, offsetY: number): ViewStyle {
  return Platform.select<ViewStyle>({
    web: { boxShadow: `0px ${offsetY}px ${radiusPx}px rgba(27, 27, 58, ${opacity})` } as ViewStyle,
    default: {
      shadowColor: palette.ink[900],
      shadowOpacity: opacity,
      shadowRadius: radiusPx,
      shadowOffset: { width: 0, height: offsetY },
      elevation,
    },
  }) as ViewStyle;
}

const shared = {
  radius,
  space,
  fontFamily,
  shadow: {
    card: shadow(2, 0.06, 10, 4),
    raised: shadow(6, 0.12, 18, 8),
    float: shadow(12, 0.18, 28, 14),
  },
};

const baseColors = {
  text: palette.ink[900],
  textMuted: palette.ink[500],
  textSoft: palette.ink[400],
  textOnPrimary: palette.white,
  primary: palette.violet[500],
  primaryDark: palette.violet[700],
  primarySoft: palette.violet[100],
  accent: palette.gold[500],
  accentDark: palette.gold[700],
  accentSoft: palette.gold[100],
  success: palette.green[500],
  successSoft: palette.green[100],
  warning: palette.orange[500],
  warningSoft: palette.orange[100],
  danger: palette.red[500],
  dangerSoft: palette.red[100],
  info: palette.sky[500],
  infoSoft: palette.sky[100],
  premium: palette.gold[500],
  premiumDark: palette.gold[700],
  premiumSoft: palette.gold[100],
  streak: palette.orange[500],
  streakSoft: palette.orange[100],
  overlay: "rgba(27, 27, 58, 0.55)",
  jars,
};

export const kidTheme: Theme = {
  ...shared,
  mode: "kid",
  headingFamily: fontFamily.display,
  colors: {
    ...baseColors,
    bg: palette.cream,
    bgAlt: palette.creamDeep,
    surface: palette.white,
    surfaceAlt: "#FFF3DF",
    border: "#F3E6CF",
    borderStrong: "#E8D6B5",
    tabBar: palette.white,
    tabActive: palette.violet[500],
    tabInactive: palette.ink[300],
  },
};

export const parentTheme: Theme = {
  ...shared,
  mode: "parent",
  headingFamily: fontFamily.extraBold,
  colors: {
    ...baseColors,
    bg: palette.ink[50],
    bgAlt: palette.ink[100],
    surface: palette.white,
    surfaceAlt: palette.violet[50],
    border: palette.ink[100],
    borderStrong: palette.ink[200],
    tabBar: palette.white,
    tabActive: palette.violet[500],
    tabInactive: palette.ink[400],
  },
};

export const themes: Record<ThemeMode, Theme> = { kid: kidTheme, parent: parentTheme };

/** Tabular numerals so money columns line up */
export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };
