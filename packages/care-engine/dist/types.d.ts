export type Level = "NORMAL" | "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
export interface DoseSnapshot {
    id: string;
    dueAt: Date;
    status: "TAKEN" | "MISSED" | "SCHEDULED";
    wasLate: boolean;
    medicationName?: string;
}
export interface CheckinSnapshot {
    localDate: string;
    status: "COMPLETED" | "MISSED" | "PENDING";
    response?: "OKAY" | "NOT_WELL";
}
export interface CareContext {
    now: Date;
    timezone: string;
    doses: DoseSnapshot[];
    checkins: CheckinSnapshot[];
    sosActive: boolean;
}
export interface RuleHit {
    ruleId: string;
    level: Level;
    text: string;
    evidence: Record<string, unknown>;
}
export interface Rule {
    id: string;
    evaluate(ctx: CareContext, config: RuleConfig): RuleHit | null;
}
export interface RiskAssessment {
    level: Level;
    hits: RuleHit[];
    rulesetVersion: string;
}
export interface MissedDoseRuleThresholds {
    singleMissWindowHours: number;
    singleMissCount: number;
    repeatedMiss24hCount: number;
    repeatedMiss72hCount: number;
}
export interface RuleConfig {
    missedDose: MissedDoseRuleThresholds;
}
//# sourceMappingURL=types.d.ts.map