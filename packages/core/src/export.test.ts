import { describe, expect, it } from "vitest";
import { buildExport, serializeExport } from "./export";
import { createDemoState } from "./seed";

describe("export", () => {
  const state = createDemoState(new Date(2026, 9, 10, 9));
  it("redacts the parent PIN and keeps everything else", () => {
    const out = buildExport(state, "2026-10-10T09:00:00.000Z");
    expect(out.family.parent?.pin).toBe("****");
    expect(out.family.kids).toHaveLength(2);
    expect(out.family.ledger.length).toBe(state.ledger.length);
    expect(state.parent?.pin).toBe("1234"); // original untouched
  });
  it("serialises to JSON that round-trips", () => {
    const json = serializeExport(state, "2026-10-10T09:00:00.000Z");
    const parsed = JSON.parse(json) as { app: string; family: { kids: unknown[] } };
    expect(parsed.app).toBe("chillar");
    expect(parsed.family.kids).toHaveLength(2);
    expect(json).not.toContain('"pin": "1234"');
  });
});
