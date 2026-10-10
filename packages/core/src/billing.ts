import { PLANS, type Plan, type PlanId } from "./entitlements";
import { formatINR } from "./money";
import type { ISODateTime } from "./time";

/**
 * Billing abstraction. The shapes mirror RevenueCat (offerings → packages, customer info →
 * active entitlement) so swapping the mock for `react-native-purchases` is a thin adapter.
 */

export type BillingStore = "mock" | "app_store" | "play_store" | "web";

export interface BillingPackage {
  id: PlanId;
  productId: string;
  plan: Plan;
  priceString: string;
  /** e.g. "₹83/month" for yearly */
  perMonthString: string;
}

export interface BillingOffering {
  packages: BillingPackage[];
  defaultPackageId: PlanId;
}

export interface CustomerInfo {
  appUserId: string;
  activePlan: PlanId;
  expiresAt: ISODateTime | null;
  willRenew: boolean;
  isTrial: boolean;
  store: BillingStore;
}

export type PurchaseResult =
  | { status: "success"; customerInfo: CustomerInfo }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export interface BillingProvider {
  configure(appUserId: string): Promise<void>;
  getOfferings(): Promise<BillingOffering>;
  purchase(packageId: PlanId): Promise<PurchaseResult>;
  restorePurchases(): Promise<CustomerInfo>;
  getCustomerInfo(): Promise<CustomerInfo>;
}

export function buildOffering(): BillingOffering {
  const packages: BillingPackage[] = (["premium_yearly", "premium_monthly"] as const).map((id) => {
    const plan = PLANS[id];
    const perMonth = plan.period === "year" ? Math.round(plan.pricePaise / 12) : plan.pricePaise;
    return {
      id,
      productId: plan.productId ?? id,
      plan,
      priceString: `${formatINR(plan.pricePaise, { showPaise: false })}/${plan.period === "year" ? "year" : "month"}`,
      perMonthString: `${formatINR(perMonth, { showPaise: false })}/month`,
    };
  });
  return { packages, defaultPackageId: "premium_yearly" };
}

export function freeCustomer(appUserId: string, store: BillingStore = "mock"): CustomerInfo {
  return { appUserId, activePlan: "free", expiresAt: null, willRenew: false, isTrial: false, store };
}

export interface MockBillingOptions {
  /** Simulated network latency */
  delayMs?: number;
  now?: () => Date;
}

/** In-memory provider used for development, demos and tests. */
export class MockBillingProvider implements BillingProvider {
  private info: CustomerInfo | null = null;
  private failNextWith: string | null = null;
  private cancelNext = false;
  private readonly delayMs: number;
  private readonly now: () => Date;

  constructor(opts: MockBillingOptions = {}) {
    this.delayMs = opts.delayMs ?? 0;
    this.now = opts.now ?? (() => new Date());
  }

  /** Test hook: make the next purchase fail. */
  failNext(message = "Payment declined"): void {
    this.failNextWith = message;
  }

  /** Test hook: make the next purchase look user-cancelled. */
  cancelNextPurchase(): void {
    this.cancelNext = true;
  }

  async configure(appUserId: string): Promise<void> {
    if (!this.info || this.info.appUserId !== appUserId) this.info = freeCustomer(appUserId);
  }

  async getOfferings(): Promise<BillingOffering> {
    await this.wait();
    return buildOffering();
  }

  async purchase(packageId: PlanId): Promise<PurchaseResult> {
    await this.wait();
    if (this.cancelNext) {
      this.cancelNext = false;
      return { status: "cancelled" };
    }
    if (this.failNextWith) {
      const message = this.failNextWith;
      this.failNextWith = null;
      return { status: "error", message };
    }
    const plan = PLANS[packageId];
    if (!plan.productId) return { status: "error", message: "That plan cannot be purchased" };
    const start = this.now();
    const expires = new Date(start);
    if (plan.period === "year") expires.setFullYear(expires.getFullYear() + 1);
    else expires.setMonth(expires.getMonth() + 1);
    const info: CustomerInfo = {
      appUserId: this.info?.appUserId ?? "anonymous",
      activePlan: packageId,
      expiresAt: expires.toISOString(),
      willRenew: true,
      isTrial: plan.trialDays > 0,
      store: "mock",
    };
    this.info = info;
    return { status: "success", customerInfo: info };
  }

  async restorePurchases(): Promise<CustomerInfo> {
    await this.wait();
    return this.info ?? freeCustomer("anonymous");
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    return this.info ?? freeCustomer("anonymous");
  }

  private wait(): Promise<void> {
    if (this.delayMs <= 0) return Promise.resolve();
    const timers = globalThis as unknown as { setTimeout: (fn: () => void, ms: number) => unknown };
    return new Promise((resolve) => timers.setTimeout(resolve, this.delayMs));
  }
}
