import { z } from "zod";
import { Role, DoseStatus, ResolvedVia, EventType, AlertKind, AlertLevel, AlertStatus, AlertResolution, AlertFeedback, DeliveryChannel, } from "./enums.js";
export const uuidSchema = z.string().uuid();
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const isoDateSchema = z.string().date();
export const timeHHMMSchema = z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:MM format");
export const daysOfWeekSchema = z
    .array(z.number().int().min(0).max(6))
    .min(1, "At least one day of week required")
    .describe("Days of week using 0=Sunday..6=Saturday (consistent across shared contracts and DB)");
export const roleSchema = z.enum([Role.CAREGIVER, Role.ELDERLY]);
export const doseStatusSchema = z.enum([DoseStatus.SCHEDULED, DoseStatus.TAKEN, DoseStatus.MISSED]);
export const resolvedViaSchema = z.enum([ResolvedVia.UI, ResolvedVia.NFC, ResolvedVia.SYSTEM]);
export const eventTypeSchema = z.enum([
    EventType.MEDICATION_TAKEN,
    EventType.MEDICATION_MISSED,
    EventType.ALERT_CREATED,
    EventType.ALERT_ESCALATED,
    EventType.ALERT_ACKNOWLEDGED,
    EventType.ALERT_RESOLVED,
    EventType.ALERT_AUTO_RESOLVED,
]);
export const alertKindSchema = z.enum([AlertKind.CONCERN, AlertKind.SOS]);
export const alertLevelSchema = z.enum([
    AlertLevel.NORMAL,
    AlertLevel.LOW,
    AlertLevel.MEDIUM,
    AlertLevel.HIGH,
    AlertLevel.EMERGENCY,
]);
export const alertStatusSchema = z.enum([
    AlertStatus.OPEN,
    AlertStatus.ACKNOWLEDGED,
    AlertStatus.RESOLVED,
    AlertStatus.AUTO_RESOLVED,
]);
export const alertResolutionSchema = z.enum([
    AlertResolution.ACTION_TAKEN,
    AlertResolution.CHECKED_OK,
    AlertResolution.FALSE_ALARM,
    AlertResolution.OTHER,
]);
export const alertFeedbackSchema = z.enum([AlertFeedback.USEFUL, AlertFeedback.NOT_NEEDED]);
export const deliveryChannelSchema = z.enum([DeliveryChannel.PUSH, DeliveryChannel.DIGEST_PUSH]);
export const loginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export const loginResponseSchema = z.object({
    accessToken: z.string(),
    user: z.object({
        id: uuidSchema,
        role: roleSchema,
        fullName: z.string(),
        email: z.string().email().optional(),
    }),
});
export const createElderlyRequestSchema = z.object({
    fullName: z.string().min(1),
    dateOfBirth: isoDateSchema.optional(),
    checkinWindowStart: timeHHMMSchema.optional(),
    checkinWindowEnd: timeHHMMSchema.optional(),
    timezone: z.string().min(1).optional(),
});
export const medicationConfirmationRequestSchema = z.object({
    doseId: uuidSchema,
    source: z.enum(["UI", "NFC"]),
    occurredAt: isoDateTimeSchema,
    clientEventId: uuidSchema,
});
export const createMedicationRequestSchema = z.object({
    name: z.string().min(1),
    strength: z.string().optional(),
    form: z.string().optional(),
    instructions: z.string().optional(),
    active: z.boolean().optional(),
});
export const createScheduleRequestSchema = z.object({
    localTime: timeHHMMSchema,
    daysOfWeek: daysOfWeekSchema.default([0, 1, 2, 3, 4, 5, 6]),
    doseText: z.string().min(1),
    graceMinutes: z.number().int().min(0).default(30),
    startDate: isoDateSchema,
    endDate: isoDateSchema.optional(),
    active: z.boolean().optional(),
});
export const alertAcknowledgeRequestSchema = z.object({}).optional();
export const alertResolveRequestSchema = z.object({
    resolution: alertResolutionSchema,
    feedback: alertFeedbackSchema.optional(),
    note: z.string().max(500).optional(),
});
