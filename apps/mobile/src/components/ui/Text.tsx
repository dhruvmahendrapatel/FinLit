import { forwardRef } from "react";
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";

import { useTheme } from "@/design";
import { tabularNums } from "@/design/tokens";

export type TextVariant =
  | "display"
  | "title"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyRegular"
  | "bodyStrong"
  | "caption"
  | "captionStrong"
  | "label"
  | "money"
  | "moneyLg";

export type TextTone =
  | "default"
  | "muted"
  | "soft"
  | "onPrimary"
  | "primary"
  | "accent"
  | "danger"
  | "success"
  | "warning"
  | "premium"
  | "inherit";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle["textAlign"];
  color?: string;
}

const SIZES: Record<TextVariant, { size: number; line: number }> = {
  display: { size: 34, line: 40 },
  title: { size: 28, line: 34 },
  h1: { size: 24, line: 30 },
  h2: { size: 20, line: 26 },
  h3: { size: 17, line: 22 },
  body: { size: 15, line: 22 },
  bodyRegular: { size: 15, line: 22 },
  bodyStrong: { size: 15, line: 22 },
  caption: { size: 13, line: 18 },
  captionStrong: { size: 13, line: 18 },
  label: { size: 12, line: 16 },
  money: { size: 22, line: 28 },
  moneyLg: { size: 34, line: 40 },
};

export const Text = forwardRef<RNText, TextProps>(function Text(
  { variant = "body", tone = "default", align, color, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const { fontFamily, headingFamily, colors } = theme;
  const isHeading = variant === "display" || variant === "title" || variant === "h1" || variant === "h2";
  const family: Record<TextVariant, string> = {
    display: headingFamily,
    title: headingFamily,
    h1: headingFamily,
    h2: headingFamily,
    h3: fontFamily.extraBold,
    body: fontFamily.semiBold,
    bodyRegular: fontFamily.regular,
    bodyStrong: fontFamily.bold,
    caption: fontFamily.semiBold,
    captionStrong: fontFamily.bold,
    label: fontFamily.extraBold,
    money: fontFamily.black,
    moneyLg: fontFamily.black,
  };
  const toneColor: Record<TextTone, string | undefined> = {
    default: colors.text,
    muted: colors.textMuted,
    soft: colors.textSoft,
    onPrimary: colors.textOnPrimary,
    primary: colors.primary,
    accent: colors.accentDark,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
    premium: colors.premiumDark,
    inherit: undefined,
  };
  const { size, line } = SIZES[variant];
  const base: TextStyle = {
    fontFamily: family[variant],
    fontSize: size,
    lineHeight: theme.mode === "kid" && isHeading ? line + 2 : line,
    color: color ?? toneColor[tone],
    textAlign: align,
  };
  if (variant === "label") {
    base.textTransform = "uppercase";
    base.letterSpacing = 0.8;
  }
  if (variant === "money" || variant === "moneyLg") Object.assign(base, tabularNums);
  return <RNText ref={ref} {...rest} style={[base, style]} />;
});
