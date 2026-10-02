import { z } from "zod";
export declare const uuidSchema: z.ZodString;
export declare const isoDateTimeSchema: z.ZodString;
export declare const isoDateSchema: z.ZodString;
export declare const timeHHMMSchema: z.ZodString;
export declare const daysOfWeekSchema: z.ZodArray<z.ZodNumber, "many">;
export declare const roleSchema: z.ZodEnum<["CAREGIVER", "ELDERLY"]>;
export declare const doseStatusSchema: z.ZodEnum<["SCHEDULED", "TAKEN", "MISSED"]>;
export declare const resolvedViaSchema: z.ZodEnum<["UI", "NFC", "SYSTEM"]>;
export declare const eventTypeSchema: z.ZodEnum<["MEDICATION_TAKEN", "MEDICATION_MISSED", "ALERT_CREATED", "ALERT_ESCALATED", "ALERT_ACKNOWLEDGED", "ALERT_RESOLVED", "ALERT_AUTO_RESOLVED"]>;
export declare const alertKindSchema: z.ZodEnum<["CONCERN", "SOS"]>;
export declare const alertLevelSchema: z.ZodEnum<["NORMAL", "LOW", "MEDIUM", "HIGH", "EMERGENCY"]>;
export declare const alertStatusSchema: z.ZodEnum<["OPEN", "ACKNOWLEDGED", "RESOLVED", "AUTO_RESOLVED"]>;
export declare const alertResolutionSchema: z.ZodEnum<["ACTION_TAKEN", "CHECKED_OK", "FALSE_ALARM", "OTHER"]>;
export declare const alertFeedbackSchema: z.ZodEnum<["USEFUL", "NOT_NEEDED"]>;
export declare const deliveryChannelSchema: z.ZodEnum<["PUSH", "DIGEST_PUSH"]>;
export declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export declare const loginResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        role: z.ZodEnum<["CAREGIVER", "ELDERLY"]>;
        fullName: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        role: "CAREGIVER" | "ELDERLY";
        fullName: string;
        email?: string | undefined;
    }, {
        id: string;
        role: "CAREGIVER" | "ELDERLY";
        fullName: string;
        email?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    user: {
        id: string;
        role: "CAREGIVER" | "ELDERLY";
        fullName: string;
        email?: string | undefined;
    };
}, {
    accessToken: string;
    user: {
        id: string;
        role: "CAREGIVER" | "ELDERLY";
        fullName: string;
        email?: string | undefined;
    };
}>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export declare const createElderlyRequestSchema: z.ZodObject<{
    fullName: z.ZodString;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    checkinWindowStart: z.ZodOptional<z.ZodString>;
    checkinWindowEnd: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    dateOfBirth?: string | undefined;
    checkinWindowStart?: string | undefined;
    checkinWindowEnd?: string | undefined;
    timezone?: string | undefined;
}, {
    fullName: string;
    dateOfBirth?: string | undefined;
    checkinWindowStart?: string | undefined;
    checkinWindowEnd?: string | undefined;
    timezone?: string | undefined;
}>;
export type CreateElderlyRequest = z.infer<typeof createElderlyRequestSchema>;
export declare const medicationConfirmationRequestSchema: z.ZodObject<{
    doseId: z.ZodString;
    source: z.ZodEnum<["UI", "NFC"]>;
    occurredAt: z.ZodString;
    clientEventId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    doseId: string;
    source: "UI" | "NFC";
    occurredAt: string;
    clientEventId: string;
}, {
    doseId: string;
    source: "UI" | "NFC";
    occurredAt: string;
    clientEventId: string;
}>;
export type MedicationConfirmationRequest = z.infer<typeof medicationConfirmationRequestSchema>;
export declare const createMedicationRequestSchema: z.ZodObject<{
    name: z.ZodString;
    strength: z.ZodOptional<z.ZodString>;
    form: z.ZodOptional<z.ZodString>;
    instructions: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    strength?: string | undefined;
    form?: string | undefined;
    instructions?: string | undefined;
    active?: boolean | undefined;
}, {
    name: string;
    strength?: string | undefined;
    form?: string | undefined;
    instructions?: string | undefined;
    active?: boolean | undefined;
}>;
export type CreateMedicationRequest = z.infer<typeof createMedicationRequestSchema>;
export declare const createScheduleRequestSchema: z.ZodObject<{
    localTime: z.ZodString;
    daysOfWeek: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
    doseText: z.ZodString;
    graceMinutes: z.ZodDefault<z.ZodNumber>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    localTime: string;
    daysOfWeek: number[];
    doseText: string;
    graceMinutes: number;
    startDate: string;
    active?: boolean | undefined;
    endDate?: string | undefined;
}, {
    localTime: string;
    doseText: string;
    startDate: string;
    active?: boolean | undefined;
    daysOfWeek?: number[] | undefined;
    graceMinutes?: number | undefined;
    endDate?: string | undefined;
}>;
export type CreateScheduleRequest = z.infer<typeof createScheduleRequestSchema>;
export declare const alertAcknowledgeRequestSchema: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>;
export type AlertAcknowledgeRequest = z.infer<typeof alertAcknowledgeRequestSchema>;
export declare const alertResolveRequestSchema: z.ZodObject<{
    resolution: z.ZodEnum<["ACTION_TAKEN", "CHECKED_OK", "FALSE_ALARM", "OTHER"]>;
    feedback: z.ZodOptional<z.ZodEnum<["USEFUL", "NOT_NEEDED"]>>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resolution: "ACTION_TAKEN" | "CHECKED_OK" | "FALSE_ALARM" | "OTHER";
    feedback?: "USEFUL" | "NOT_NEEDED" | undefined;
    note?: string | undefined;
}, {
    resolution: "ACTION_TAKEN" | "CHECKED_OK" | "FALSE_ALARM" | "OTHER";
    feedback?: "USEFUL" | "NOT_NEEDED" | undefined;
    note?: string | undefined;
}>;
export type AlertResolveRequest = z.infer<typeof alertResolveRequestSchema>;
//# sourceMappingURL=schemas.d.ts.map