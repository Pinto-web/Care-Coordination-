import { allRules } from "./rules/index.js";
import { defaultRuleConfig, RULESET_VERSION } from "./config.js";
function levelRank(level) {
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
export function assess(ctx, config = defaultRuleConfig) {
    const hits = allRules
        .map((rule) => rule.evaluate(ctx, config))
        .filter((h) => h !== null);
    if (hits.length === 0) {
        return {
            level: "NORMAL",
            hits: [],
            rulesetVersion: RULESET_VERSION,
        };
    }
    let maxLevel = "LOW";
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
