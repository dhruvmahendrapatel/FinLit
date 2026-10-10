import { describe, expect, it } from "vitest";
import { adPolicy } from "./ads";
import { buildOffering, MockBillingProvider } from "./billing";
import { canUse, entitlementsFor, kidLimitReached, monthlyEquivalent, paywallFeatures, PLANS } from "./entitlements";

describe("entitlements", () => {
  it("gates premium features", () => {
    expect(canUse("free", "ad_free")).toBe(false);
    expect(canUse("premium_monthly", "ad_free")).toBe(true);
    expect(entitlementsFor("free").maxKids).toBe(2);
    expect(kidLimitReached("free", 2)).toBe(true);
    expect(kidLimitReached("premium_yearly", 20)).toBe(false);
    expect(paywallFeatures()[0]?.feature).toBe("ad_free");
  });

  it("prices the yearly plan below 12 months of monthly", () => {
    expect(PLANS.premium_yearly.pricePaise).toBeLessThan(PLANS.premium_monthly.pricePaise * 12);
    expect(monthlyEquivalent(PLANS.premium_yearly)).toBe(8325);
    const offering = buildOffering();
    expect(offering.defaultPackageId).toBe("premium_yearly");
    expect(offering.packages.find((p) => p.id === "premium_yearly")?.priceString).toBe("₹999/year");
    expect(offering.packages.find((p) => p.id === "premium_monthly")?.priceString).toBe("₹99/month");
  });
});

describe("ad policy (DPDP guardrails)", () => {
  it("never personalises for kids and removes ads on premium", () => {
    expect(adPolicy({ audience: "kid", planId: "free", parentAdConsent: true })).toMatchObject({ show: true, mode: "contextual" });
    expect(adPolicy({ audience: "kid", planId: "free", parentAdConsent: true, kidAgeBand: "explorer", inLesson: true }).show).toBe(false);
    expect(adPolicy({ audience: "parent", planId: "free", parentAdConsent: true }).mode).toBe("consented_personalized");
    expect(adPolicy({ audience: "parent", planId: "free", parentAdConsent: false }).mode).toBe("contextual");
    expect(adPolicy({ audience: "parent", planId: "premium_yearly", parentAdConsent: true }).show).toBe(false);
  });
});

describe("mock billing", () => {
  it("purchases, cancels and fails on demand", async () => {
    const billing = new MockBillingProvider({ now: () => new Date("2026-10-10T00:00:00.000Z") });
    await billing.configure("family_1");
    expect((await billing.getCustomerInfo()).activePlan).toBe("free");
    billing.cancelNextPurchase();
    expect((await billing.purchase("premium_yearly")).status).toBe("cancelled");
    billing.failNext("Card declined");
    expect(await billing.purchase("premium_yearly")).toEqual({ status: "error", message: "Card declined" });
    const ok = await billing.purchase("premium_yearly");
    expect(ok.status).toBe("success");
    if (ok.status === "success") {
      expect(ok.customerInfo.activePlan).toBe("premium_yearly");
      expect(ok.customerInfo.expiresAt).toBe("2027-10-10T00:00:00.000Z");
      expect(ok.customerInfo.isTrial).toBe(true);
    }
    expect((await billing.restorePurchases()).activePlan).toBe("premium_yearly");
  });
});
