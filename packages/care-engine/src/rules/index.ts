import { medSingleMissRule, medRepeatedMissRule } from "./med-miss.js";
import type { Rule } from "../types.js";

export const medicationRules: Rule[] = [medSingleMissRule, medRepeatedMissRule];
export const allRules: Rule[] = [...medicationRules];

export { medSingleMissRule, medRepeatedMissRule };
