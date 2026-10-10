import { DomainError } from "@finlit/core";

import { toast } from "@/store/toast-store";

/** Run a store command, turning DomainErrors into friendly toasts. Returns true on success. */
export function tryCommand(fn: () => void, opts: { onPremiumRequired?: () => void } = {}): boolean {
  try {
    fn();
    return true;
  } catch (err) {
    if (err instanceof DomainError) {
      if (err.code === "premium_required" && opts.onPremiumRequired) {
        opts.onPremiumRequired();
        return false;
      }
      toast({ title: err.message, emoji: "🙈", tone: "danger" });
      return false;
    }
    throw err;
  }
}
