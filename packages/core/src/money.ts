/**
 * All money in Chillar is stored as integer paise so sums are exact.
 * ₹1 = 100 paise. Display helpers format with Indian digit grouping (₹12,34,567).
 */
export type Paise = number;

export const PAISE_PER_RUPEE = 100;

export function rupees(amount: number): Paise {
  return Math.round(amount * PAISE_PER_RUPEE);
}

export function toRupees(paise: Paise): number {
  return paise / PAISE_PER_RUPEE;
}

/** Indian digit grouping for a string of digits: "1234567" -> "12,34,567" */
export function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
}

export interface FormatINROptions {
  /** Show ".50" style paise when non-zero. Default true. */
  showPaise?: boolean;
  /** Prefix "+" on positive values. Default false. */
  explicitSign?: boolean;
}

export function formatINR(paise: Paise, opts: FormatINROptions = {}): string {
  const showPaise = opts.showPaise ?? true;
  const explicitSign = opts.explicitSign ?? false;
  const rounded = Math.round(paise);
  const sign = rounded < 0 ? "-" : explicitSign && rounded > 0 ? "+" : "";
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / PAISE_PER_RUPEE);
  const frac = abs % PAISE_PER_RUPEE;
  const fracStr = showPaise && frac !== 0 ? `.${String(frac).padStart(2, "0")}` : "";
  return `${sign}₹${groupIndian(String(whole))}${fracStr}`;
}

/** Compact Indian notation: ₹1.2k, ₹3.5L, ₹1.1Cr */
export function formatINRCompact(paise: Paise): string {
  const r = Math.abs(paise) / PAISE_PER_RUPEE;
  const sign = paise < 0 ? "-" : "";
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ""));
  if (r >= 1_00_00_000) return `${sign}₹${fmt(r / 1_00_00_000)}Cr`;
  if (r >= 1_00_000) return `${sign}₹${fmt(r / 1_00_000)}L`;
  if (r >= 1_000) return `${sign}₹${fmt(r / 1_000)}k`;
  return formatINR(paise, { showPaise: false });
}

export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

export function clampPaise(p: Paise): Paise {
  return Math.max(0, Math.round(p));
}
