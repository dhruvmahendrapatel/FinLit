import { assert } from "./errors";
import { newId } from "./ids";
import { createSplitEntries } from "./ledger";
import type { Paise } from "./money";
import { addDays, fromISODate, toISODate, type ISODate, type ISODateTime } from "./time";
import type { Chore, ChoreRecurrence, ChoreStatus, JarAllocation, LedgerEntry } from "./types";

const TRANSITIONS: Record<ChoreStatus, readonly ChoreStatus[]> = {
  open: ["claimed", "submitted"],
  claimed: ["submitted", "open"],
  submitted: ["approved", "rejected"],
  approved: [],
  rejected: ["open", "submitted"],
};

export function canTransition(from: ChoreStatus, to: ChoreStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export interface NewChoreInput {
  title: string;
  emoji: string;
  rewardPaise: Paise;
  kidId?: string | null;
  recurrence?: ChoreRecurrence;
  dueOn?: ISODate;
  now: ISODateTime;
}

export function createChore(input: NewChoreInput): Chore {
  assert(input.title.trim().length > 0, "chore_title", "Chore needs a title");
  assert(input.rewardPaise >= 0, "chore_reward", "Reward cannot be negative");
  const chore: Chore = {
    id: newId("chore"),
    title: input.title.trim(),
    emoji: input.emoji,
    rewardPaise: Math.round(input.rewardPaise),
    kidId: input.kidId ?? null,
    status: "open",
    recurrence: input.recurrence ?? "once",
    createdAt: input.now,
  };
  if (input.dueOn !== undefined) chore.dueOn = input.dueOn;
  return chore;
}

export function isChoreAvailableTo(chore: Chore, kidId: string): boolean {
  return chore.status === "open" && (chore.kidId === null || chore.kidId === kidId);
}

export function claimChore(chore: Chore, kidId: string, now: ISODateTime): Chore {
  assert(canTransition(chore.status, "claimed"), "chore_state", `Cannot claim a ${chore.status} chore`);
  assert(chore.kidId === null || chore.kidId === kidId, "chore_owner", "This chore is for someone else");
  return { ...chore, status: "claimed", claimedBy: kidId, claimedAt: now };
}

export function unclaimChore(chore: Chore, kidId: string): Chore {
  assert(chore.status === "claimed" && chore.claimedBy === kidId, "chore_state", "Only the claimer can unclaim");
  const { claimedBy: _claimedBy, claimedAt: _claimedAt, ...rest } = chore;
  return { ...rest, status: "open" };
}

export function submitChore(
  chore: Chore,
  kidId: string,
  now: ISODateTime,
  proof: { note?: string; photoUri?: string } = {},
): Chore {
  assert(canTransition(chore.status, "submitted"), "chore_state", `Cannot submit a ${chore.status} chore`);
  if (chore.status === "claimed" || chore.status === "rejected") {
    assert(chore.claimedBy === kidId, "chore_owner", "Only the claimer can submit this chore");
  } else {
    assert(chore.kidId === null || chore.kidId === kidId, "chore_owner", "This chore is for someone else");
  }
  const next: Chore = { ...chore, status: "submitted", claimedBy: kidId, submittedAt: now };
  if (next.claimedAt === undefined) next.claimedAt = now;
  if (proof.note !== undefined) next.proofNote = proof.note;
  if (proof.photoUri !== undefined) next.proofPhotoUri = proof.photoUri;
  delete next.rejectReason;
  return next;
}

export interface ApproveResult {
  chore: Chore;
  entries: LedgerEntry[];
  /** For recurring chores, the next open occurrence */
  next: Chore | null;
}

export function approveChore(chore: Chore, allocation: JarAllocation, now: ISODateTime): ApproveResult {
  assert(canTransition(chore.status, "approved"), "chore_state", `Cannot approve a ${chore.status} chore`);
  const kidId = chore.claimedBy;
  assert(kidId, "chore_owner", "Submitted chore has no claimer");
  const approved: Chore = { ...chore, status: "approved", resolvedAt: now };
  const entries =
    chore.rewardPaise > 0
      ? createSplitEntries({
          kidId,
          amountPaise: chore.rewardPaise,
          allocation,
          kind: "chore",
          memo: chore.title,
          at: now,
          refId: chore.id,
          emoji: chore.emoji,
        })
      : [];
  return { chore: approved, entries, next: nextOccurrence(approved, now) };
}

export function rejectChore(chore: Chore, reason: string, now: ISODateTime): Chore {
  assert(canTransition(chore.status, "rejected"), "chore_state", `Cannot reject a ${chore.status} chore`);
  return { ...chore, status: "rejected", rejectReason: reason, resolvedAt: now };
}

export function reopenChore(chore: Chore): Chore {
  assert(canTransition(chore.status, "open"), "chore_state", `Cannot reopen a ${chore.status} chore`);
  const { claimedBy: _c, claimedAt: _ca, submittedAt: _s, proofNote: _p, proofPhotoUri: _u, rejectReason: _r, resolvedAt: _ra, ...rest } = chore;
  return { ...rest, status: "open" };
}

/** Spawn the next occurrence of a recurring chore after approval. */
export function nextOccurrence(chore: Chore, now: ISODateTime): Chore | null {
  if (chore.recurrence === "once") return null;
  const step = chore.recurrence === "daily" ? 1 : 7;
  const base = chore.dueOn ? fromISODate(chore.dueOn) : new Date(now);
  const next: Chore = {
    id: newId("chore"),
    title: chore.title,
    emoji: chore.emoji,
    rewardPaise: chore.rewardPaise,
    kidId: chore.kidId,
    status: "open",
    recurrence: chore.recurrence,
    createdAt: now,
    dueOn: toISODate(addDays(base, step)),
  };
  return next;
}

export const CHORE_IDEAS: ReadonlyArray<{ title: string; emoji: string; rupees: number; recurrence: ChoreRecurrence }> = [
  { title: "Make your bed", emoji: "🛏️", rupees: 10, recurrence: "daily" },
  { title: "Water the plants", emoji: "🪴", rupees: 15, recurrence: "daily" },
  { title: "Fold the laundry", emoji: "🧺", rupees: 30, recurrence: "weekly" },
  { title: "Set the table for dinner", emoji: "🍽️", rupees: 10, recurrence: "daily" },
  { title: "Help Dadi with groceries", emoji: "🛒", rupees: 50, recurrence: "once" },
  { title: "Read for 20 minutes", emoji: "📚", rupees: 20, recurrence: "daily" },
  { title: "Clean your study desk", emoji: "🧹", rupees: 25, recurrence: "weekly" },
  { title: "Feed the dog", emoji: "🐶", rupees: 10, recurrence: "daily" },
  { title: "Finish homework before 7pm", emoji: "✏️", rupees: 20, recurrence: "daily" },
  { title: "Wash the car with Papa", emoji: "🚗", rupees: 100, recurrence: "once" },
];
