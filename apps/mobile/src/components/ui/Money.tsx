import { formatINR, formatINRCompact, type Paise } from "@finlit/core";

import { Text, type TextProps } from "./Text";

export interface MoneyProps extends Omit<TextProps, "children"> {
  paise: Paise;
  compact?: boolean;
  showPaise?: boolean;
  signed?: boolean;
}

export function Money({ paise, compact = false, showPaise = false, signed = false, variant = "money", ...rest }: MoneyProps) {
  const label = compact ? formatINRCompact(paise) : formatINR(paise, { showPaise, explicitSign: signed });
  return (
    <Text variant={variant} {...rest}>
      {label}
    </Text>
  );
}
