import { allRules } from "./rules/index.js";
import { defaultRuleConfig, RULESET_VERSION } from "./config.js";
import type { CareContext, RiskAssessment, RuleConfig, Level } from "./types.js";

function levelRank(level: Level): number {
  switch (level) {
    case "NORMAL":
      return 0;
    case "LOW":
      return 1;
    case "MEDIUM":
      return 2;
    case "HIGH":
      return 3;
    case "EMERGENCY":
      return 4;
    default:
      return 0;
  }
}

export function assess(ctx: CareContext, config: RuleConfig = defaultRuleConfig): RiskAssessment {
  const hits = allRules
    .map((rule) => rule.evaluate(ctx, config))
    .filter((h): h is NonNullable<ReturnType<typeof allRules[number]["evaluate"]>> => h !== null);

  if (hits.length === 0) {
    return {
      level: "NORMAL",
      hits: [],
      rulesetVersion: RULESET_VERSION,
    };
  }

  let maxLevel: Level = "LOW";
  for (const h of hits) {
    if (levelRank(h.level) > levelRank(maxLevel)) {
      maxLevel = h.level;
    }
  }

  return {
    level: maxLevel,
    hits,
    rulesetVersion: RULESET_VERSION,
  };
}
