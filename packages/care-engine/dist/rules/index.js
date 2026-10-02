import { medSingleMissRule, medRepeatedMissRule } from "./med-miss.js";
export const medicationRules = [medSingleMissRule, medRepeatedMissRule];
export const allRules = [...medicationRules];
export { medSingleMissRule, medRepeatedMissRule };
