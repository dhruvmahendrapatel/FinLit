import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

import { useTheme } from "@/design";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.text} />;
}
