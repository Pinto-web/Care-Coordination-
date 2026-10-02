import type { Role, DoseStatus, ResolvedVia, EventType, AlertKind, AlertLevel, AlertStatus, AlertResolution, AlertFeedback, DeliveryChannel } from "./enums.js";
import type { LoginRequest, LoginResponse, CreateElderlyRequest, MedicationConfirmationRequest, CreateMedicationRequest, CreateScheduleRequest, AlertAcknowledgeRequest, AlertResolveRequest } from "./schemas.js";
export type { Role, DoseStatus, ResolvedVia, EventType, AlertKind, AlertLevel, AlertStatus, AlertResolution, AlertFeedback, DeliveryChannel, };
export type { LoginRequest, LoginResponse, CreateElderlyRequest, MedicationConfirmationRequest, CreateMedicationRequest, CreateScheduleRequest, AlertAcknowledgeRequest, AlertResolveRequest, };
export interface User {
    id: string;
    role: Role;
    fullName: string;
    email?: string;
}
export interface ElderlySummary {
    id: string;
    fullName: string;
    timezone: string;
}
export interface Medication {
    id: string;
    elderlyId: string;
    name: string;
    strength?: string;
    form?: string;
    instructions?: string;
    active: boolean;
}
export interface MedicationSchedule {
    id: string;
    medicationId: string;
    elderlyId: string;
    localTime: string;
    daysOfWeek: number[];
    doseText: string;
    graceMinutes: number;
    startDate: string;
    endDate?: string;
    active: boolean;
}
export interface ScheduledDose {
    id: string;
    scheduleId: string;
    medicationId: string;
    elderlyId: string;
    dueAt: string;
    graceDeadline: string;
    status: DoseStatus;
    resolvedAt?: string;
    resolvedVia?: ResolvedVia;
    wasLate: boolean;
}
export interface Event {
    id: string;
    elderlyId: string;
    type: EventType;
    occurredAt: string;
    recordedAt: string;
    source: "UI" | "NFC" | "SYSTEM" | "CAREGIVER";
    actorUserId?: string;
    refType?: string;
    refId?: string;
    payload: Record<string, unknown>;
    clientEventId?: string;
}
export interface RuleHit {
    ruleId: string;
    level: AlertLevel;
    text: string;
    evidence: Record<string, unknown>;
}
export interface RiskAssessment {
    id: string;
    elderlyId: string;
    evaluatedAt: string;
    triggerEventId?: string;
    level: AlertLevel;
    hits: RuleHit[];
    rulesetVersion: string;
}
export interface Alert {
    id: string;
    elderlyId: string;
    kind: AlertKind;
    level: AlertLevel;
    peakLevel: AlertLevel;
    status: AlertStatus;
    title: string;
    summary: string;
    reasons: Array<{
        ruleId: string;
        text: string;
        evidence?: Record<string, unknown>;
    }>;
    dedupeKey?: string;
    assessmentId?: string;
    createdAt: string;
    updatedAt?: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
    resolvedAt?: string;
    resolvedBy?: string;
    resolution?: AlertResolution;
    feedback?: AlertFeedback;
    note?: string;
}
export interface AlertListItem extends Alert {
}
//# sourceMappingURL=types.d.ts.map