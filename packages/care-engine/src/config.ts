import type { RuleConfig } from "./types.js";

export const RULESET_VERSION = "v1.med";

export const defaultRuleConfig: RuleConfig = {
  missedDose: {
    singleMissWindowHours: 24,
    singleMissCount: 1,
    repeatedMiss24hCount: 2,
    repeatedMiss72hCount: 3,
  },
};
