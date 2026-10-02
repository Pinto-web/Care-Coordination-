import { describe, it, expect } from "vitest";
import { assess } from "../assess.js";
import type { CareContext, DoseSnapshot } from "../types.js";

const TZ = "Asia/Kolkata";

function missedDose(id: string, hoursAgo: number, medName?: string): DoseSnapshot {
  const now = new Date("2025-01-01T10:00:00.000Z");
  const dueAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  return {
    id,
    dueAt,
    status: "MISSED",
    wasLate: false,
    medicationName: medName,
  };
}

function takenDose(id: string, hoursAgo: number): DoseSnapshot {
  const now = new Date("2025-01-01T10:00:00.000Z");
  const dueAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  return {
    id,
    dueAt,
    status: "TAKEN",
    wasLate: false,
  };
}

function scheduledDose(id: string, minutesAgo: number): DoseSnapshot {
  const now = new Date("2025-01-01T10:00:00.000Z");
  const dueAt = new Date(now.getTime() - minutesAgo * 60 * 1000);
  return {
    id,
    dueAt,
    status: "SCHEDULED",
    wasLate: false,
  };
}

function baseCtx(doses: DoseSnapshot[]): CareContext {
  return {
    now: new Date("2025-01-01T10:00:00.000Z"),
    timezone: TZ,
    doses,
    checkins: [],
    sosActive: false,
  };
}

describe("MED_SINGLE_MISS", () => {
  it("returns NORMAL when no missed doses", () => {
    const ctx = baseCtx([takenDose("d1", 2), scheduledDose("d2", 5)]);
    const res = assess(ctx);
    expect(res.level).toBe("NORMAL");
    expect(res.hits).toHaveLength(0);
  });

  it("returns LOW for exactly 1 missed in last 24h (at ~23h59m ago)", () => {
    const ctx = baseCtx([missedDose("m1", 23.98, "Metformin")]);
    const res = assess(ctx);
    expect(res.level).toBe("LOW");
    expect(res.hits).toHaveLength(1);
    expect(res.hits[0].ruleId).toBe("MED_SINGLE_MISS");
    expect(res.hits[0].level).toBe("LOW");
    expect(res.hits[0].text).toContain("1 medication dose missed in the last 24 hours");
    expect(res.hits[0].evidence).toHaveProperty("n", 1);
    expect(res.hits[0].evidence).toHaveProperty("windowHours", 24);
  });

  it("does NOT trigger MED_SINGLE_MISS when 2 missed in 24h (repeated takes precedence/also gives MEDIUM)", () => {
    const ctx = baseCtx([
      missedDose("m1", 23, "A"),
      missedDose("m2", 22, "B"),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    expect(res.hits.some((h) => h.ruleId === "MED_REPEATED_MISS")).toBe(true);
    expect(res.hits.some((h) => h.ruleId === "MED_SINGLE_MISS")).toBe(false);
  });

  it("boundary: missed exactly at 24h ago is included (<= cutoff window inclusive)", () => {
    const ctx = baseCtx([missedDose("m1", 24.0)]);
    const res = assess(ctx);
    expect(res.level).toBe("LOW");
    expect(res.hits[0].ruleId).toBe("MED_SINGLE_MISS");
  });

  it("boundary: missed just over 24h ago is NOT counted for 24h window", () => {
    const ctx = baseCtx([missedDose("m1", 24.01)]);
    const res = assess(ctx);
    expect(res.level).toBe("NORMAL");
  });

  it("does not count TAKEN or SCHEDULED as missed", () => {
    const ctx = baseCtx([
      takenDose("t1", 1),
      scheduledDose("s1", 10),
      missedDose("m1", 12),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("LOW");
    expect(res.hits).toHaveLength(1);
    expect(res.hits[0].ruleId).toBe("MED_SINGLE_MISS");
  });

  it("wasLate flag on missed dose does not exclude it from missed count", () => {
    const ctx: CareContext = {
      now: new Date("2025-01-01T10:00:00.000Z"),
      timezone: TZ,
      doses: [
        {
          id: "m1",
          dueAt: new Date(new Date("2025-01-01T10:00:00.000Z").getTime() - 23 * 60 * 60 * 1000),
          status: "MISSED",
          wasLate: true,
        },
      ],
      checkins: [],
      sosActive: false,
    };
    const res = assess(ctx);
    expect(res.level).toBe("LOW");
    expect(res.hits[0].ruleId).toBe("MED_SINGLE_MISS");
  });
});

describe("MED_REPEATED_MISS", () => {
  it(">=2 missed in 24h returns MEDIUM", () => {
    const ctx = baseCtx([
      missedDose("m1", 23, "M1"),
      missedDose("m2", 1, "M2"),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    const repeated = res.hits.find((h) => h.ruleId === "MED_REPEATED_MISS");
    expect(repeated).toBeDefined();
    expect(repeated?.level).toBe("MEDIUM");
    expect(repeated?.evidence.n).toBe(2);
    expect(repeated?.evidence.windowHours).toBe(24);
  });

  it("exactly 3 missed in 72h returns MEDIUM (>=3 in 72h)", () => {
    const ctx = baseCtx([
      missedDose("m1", 70),
      missedDose("m2", 50),
      missedDose("m3", 10),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    const repeated = res.hits.find((h) => h.ruleId === "MED_REPEATED_MISS");
    expect(repeated).toBeDefined();
    expect(repeated?.evidence.n).toBe(3);
    expect(repeated?.evidence.windowHours).toBe(72);
  });

  it("4 missed spread across 72h also triggers (>=3)", () => {
    const ctx = baseCtx([
      missedDose("m1", 71),
      missedDose("m2", 60),
      missedDose("m3", 40),
      missedDose("m4", 5),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    const repeated = res.hits.find((h) => h.ruleId === "MED_REPEATED_MISS");
    expect(repeated?.evidence.n).toBe(4);
  });

  it("2 missed in 72h but <2 in 24h? e.g. both ~36h ago: n24<2, n72>=2; should trigger via 24h path if n24>=2? both 36h ago means n24 is 0 (each >24h). n72 is 2. So condition: n24>=2 is false, n72>=3 false -> no trigger; which matches thresholds (>=3 in 72h needed).", () => {
    const ctx = baseCtx([missedDose("m1", 36), missedDose("m2", 36)]);
    const res = assess(ctx);
    expect(res.level).toBe("NORMAL");
  });

  it("3 missed all >24h but all within 72h (e.g. 48,36,30h) triggers via 72h path (n24<2, n72>=3)", () => {
    const ctx = baseCtx([
      missedDose("m1", 48),
      missedDose("m2", 36),
      missedDose("m3", 30),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    const repeated = res.hits.find((h) => h.ruleId === "MED_REPEATED_MISS");
    expect(repeated?.evidence.windowHours).toBe(72);
    expect(repeated?.evidence.n).toBe(3);
  });

  it("uses 24h window when both conditions hold (>=2 in 24h takes precedence; we set window to 24h)", () => {
    const ctx = baseCtx([
      missedDose("m1", 23),
      missedDose("m2", 22),
      missedDose("m3", 70),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    const repeated = res.hits.find((h) => h.ruleId === "MED_REPEATED_MISS");
    expect(repeated?.evidence.windowHours).toBe(24);
    expect(repeated?.evidence.n).toBe(2);
  });

  it("grace boundary: scheduled dose not yet past grace is not MISSED (we only pass MISSED status)", () => {
    const ctx = baseCtx([
      missedDose("m1", 10),
      missedDose("m2", 5),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
  });

  it("past 72h misses do not count toward 72h window", () => {
    const ctx = baseCtx([missedDose("m1", 73), missedDose("m2", 74), missedDose("m3", 75)]);
    const res = assess(ctx);
    expect(res.level).toBe("NORMAL");
  });

  it("deterministic with mixed statuses", () => {
    const ctx = baseCtx([
      takenDose("t1", 1),
      missedDose("m1", 23),
      missedDose("m2", 22),
      scheduledDose("s1", 5),
      takenDose("t2", 30),
    ]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    const repeated = res.hits.find((h) => h.ruleId === "MED_REPEATED_MISS");
    expect(repeated?.evidence.n).toBe(2);
  });
});

describe("assess determinism and shape", () => {
  it("returns NORMAL with empty hits when no rules fire", () => {
    const ctx = baseCtx([]);
    const res = assess(ctx);
    expect(res.level).toBe("NORMAL");
    expect(res.hits).toEqual([]);
    expect(res.rulesetVersion).toBe("v1.med");
  });

  it("final level is max of hit levels (LOW+MEDIUM not possible here, but logic holds)", () => {
    const ctx = baseCtx([missedDose("m1", 23), missedDose("m2", 22)]);
    const res = assess(ctx);
    expect(res.level).toBe("MEDIUM");
    for (const h of res.hits) {
      expect(h).toHaveProperty("ruleId");
      expect(h).toHaveProperty("level");
      expect(h).toHaveProperty("text");
      expect(h).toHaveProperty("evidence");
    }
  });
});
