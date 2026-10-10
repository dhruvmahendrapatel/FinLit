import { describe, expect, it } from "vitest";
import { splitByAllocation } from "./ledger";
import { formatINR, formatINRCompact, groupIndian, rupees } from "./money";

describe("money formatting", () => {
  it("groups digits the Indian way", () => {
    expect(groupIndian("1234567")).toBe("12,34,567");
    expect(groupIndian("100000")).toBe("1,00,000");
    expect(groupIndian("999")).toBe("999");
    expect(groupIndian("1000")).toBe("1,000");
  });

  it("formats paise as rupees", () => {
    expect(formatINR(rupees(1250))).toBe("₹1,250");
    expect(formatINR(125050)).toBe("₹1,250.50");
    expect(formatINR(-2000)).toBe("-₹20");
    expect(formatINR(2000, { explicitSign: true })).toBe("+₹20");
    expect(formatINR(123456789)).toBe("₹12,34,567.89");
  });

  it("formats compact amounts", () => {
    expect(formatINRCompact(rupees(950))).toBe("₹950");
    expect(formatINRCompact(rupees(12500))).toBe("₹12.5k");
    expect(formatINRCompact(rupees(350000))).toBe("₹3.5L");
    expect(formatINRCompact(rupees(21000000))).toBe("₹2.1Cr");
  });
});

describe("splitByAllocation", () => {
  it("splits exactly with the default 40/40/10/10", () => {
    const split = splitByAllocation(rupees(100), { spend: 40, save: 40, share: 10, invest: 10 });
    expect(split).toEqual({ spend: 4000, save: 4000, share: 1000, invest: 1000 });
  });

  it("never loses a paisa on awkward amounts", () => {
    const amount = 10001; // ₹100.01
    const split = splitByAllocation(amount, { spend: 33, save: 33, share: 17, invest: 17 });
    expect(split.spend + split.save + split.share + split.invest).toBe(amount);
  });

  it("rejects allocations that do not sum to 100", () => {
    expect(() => splitByAllocation(100, { spend: 50, save: 40, share: 5, invest: 0 })).toThrow(/sum to 100/);
  });
});
