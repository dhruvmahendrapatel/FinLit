import { assert } from "./errors";
import { newId } from "./ids";
import type { Paise } from "./money";
import type { ISODateTime } from "./time";
import { JAR_KINDS, type JarAllocation, type JarKind, type LedgerEntry, type LedgerKind } from "./types";

export const EARNING_KINDS: readonly LedgerKind[] = ["allowance", "chore", "interest", "gift", "bonus"];

export function validateAllocation(a: JarAllocation): void {
  let sum = 0;
  for (const k of JAR_KINDS) {
    const v = a[k];
    assert(Number.isInteger(v) && v >= 0, "allocation_value", `Allocation for ${k} must be a whole percent`);
    sum += v;
  }
  assert(sum === 100, "allocation_sum", `Jar allocation must sum to 100, got ${sum}`);
}

/** Split an amount across jars by percent using largest-remainder so the parts sum exactly. */
export function splitByAllocation(amount: Paise, allocation: JarAllocation): Record<JarKind, Paise> {
  validateAllocation(allocation);
  const whole = Math.round(amount);
  const parts = JAR_KINDS.map((k) => {
    const exact = (whole * allocation[k]) / 100;
    const floor = Math.floor(exact);
    return { k, floor, rem: exact - floor };
  });
  let leftover = whole - parts.reduce((s, p) => s + p.floor, 0);
  const out: Record<JarKind, Paise> = { spend: 0, save: 0, share: 0, invest: 0 };
  for (const p of parts) out[p.k] = p.floor;
  const byRemainder = [...parts].sort(
    (a, b) => b.rem - a.rem || JAR_KINDS.indexOf(a.k) - JAR_KINDS.indexOf(b.k),
  );
  for (const p of byRemainder) {
    if (leftover <= 0) break;
    out[p.k] += 1;
    leftover -= 1;
  }
  return out;
}

export interface NewEntryInput {
  kidId: string;
  jar: JarKind;
  amountPaise: Paise;
  kind: LedgerKind;
  memo: string;
  at: ISODateTime;
  refId?: string;
  emoji?: string;
}

export function createEntry(input: NewEntryInput): LedgerEntry {
  const entry: LedgerEntry = {
    id: newId("txn"),
    kidId: input.kidId,
    jar: input.jar,
    amountPaise: Math.round(input.amountPaise),
    kind: input.kind,
    memo: input.memo,
    at: input.at,
  };
  if (input.refId !== undefined) entry.refId = input.refId;
  if (input.emoji !== undefined) entry.emoji = input.emoji;
  return entry;
}

/** Credit an earned amount, split into jars. Jars with a zero share get no entry. */
export function createSplitEntries(
  input: Omit<NewEntryInput, "jar"> & { allocation: JarAllocation },
): LedgerEntry[] {
  assert(input.amountPaise > 0, "amount_positive", "Split credits must be positive");
  const split = splitByAllocation(input.amountPaise, input.allocation);
  const entries: LedgerEntry[] = [];
  for (const jar of JAR_KINDS) {
    const amountPaise = split[jar];
    if (amountPaise === 0) continue;
    const base: NewEntryInput = {
      kidId: input.kidId,
      jar,
      amountPaise,
      kind: input.kind,
      memo: input.memo,
      at: input.at,
    };
    if (input.refId !== undefined) base.refId = input.refId;
    if (input.emoji !== undefined) base.emoji = input.emoji;
    entries.push(createEntry(base));
  }
  return entries;
}

export function jarBalances(entries: readonly LedgerEntry[], kidId: string): Record<JarKind, Paise> {
  const out: Record<JarKind, Paise> = { spend: 0, save: 0, share: 0, invest: 0 };
  for (const e of entries) {
    if (e.kidId !== kidId) continue;
    out[e.jar] += e.amountPaise;
  }
  return out;
}

export function totalBalance(entries: readonly LedgerEntry[], kidId: string): Paise {
  const jars = jarBalances(entries, kidId);
  return JAR_KINDS.reduce((s, k) => s + jars[k], 0);
}

/** Newest first */
export function entriesForKid(entries: readonly LedgerEntry[], kidId: string, limit?: number): LedgerEntry[] {
  const list = entries.filter((e) => e.kidId === kidId).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return limit !== undefined ? list.slice(0, limit) : list;
}

/** Sum of earning credits within [from, to] (ISO timestamps, inclusive). */
export function earnedBetween(
  entries: readonly LedgerEntry[],
  kidId: string,
  from: ISODateTime,
  to: ISODateTime,
): Paise {
  let sum = 0;
  for (const e of entries) {
    if (e.kidId !== kidId || e.amountPaise <= 0) continue;
    if (!EARNING_KINDS.includes(e.kind)) continue;
    if (e.at < from || e.at > to) continue;
    sum += e.amountPaise;
  }
  return sum;
}

/** Debit a jar, refusing to overdraw. */
export function debitJar(
  entries: readonly LedgerEntry[],
  input: Omit<NewEntryInput, "amountPaise"> & { amountPaise: Paise },
): LedgerEntry {
  assert(input.amountPaise > 0, "amount_positive", "Debit amount must be positive");
  const balance = jarBalances(entries, input.kidId)[input.jar];
  assert(
    balance >= input.amountPaise,
    "insufficient_funds",
    `Not enough in the ${input.jar} jar (have ${balance}, need ${input.amountPaise})`,
  );
  return createEntry({ ...input, amountPaise: -input.amountPaise });
}
