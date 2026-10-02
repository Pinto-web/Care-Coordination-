export const Role = {
    CAREGIVER: "CAREGIVER",
    ELDERLY: "ELDERLY",
};
export const DoseStatus = {
    SCHEDULED: "SCHEDULED",
    TAKEN: "TAKEN",
    MISSED: "MISSED",
};
export const ResolvedVia = {
    UI: "UI",
    NFC: "NFC",
    SYSTEM: "SYSTEM",
};
export const EventType = {
    MEDICATION_TAKEN: "MEDICATION_TAKEN",
    MEDICATION_MISSED: "MEDICATION_MISSED",
    ALERT_CREATED: "ALERT_CREATED",
    ALERT_ESCALATED: "ALERT_ESCALATED",
    ALERT_ACKNOWLEDGED: "ALERT_ACKNOWLEDGED",
    ALERT_RESOLVED: "ALERT_RESOLVED",
    ALERT_AUTO_RESOLVED: "ALERT_AUTO_RESOLVED",
};
export const AlertKind = {
    CONCERN: "CONCERN",
    SOS: "SOS",
};
export const AlertLevel = {
    NORMAL: "NORMAL",
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    EMERGENCY: "EMERGENCY",
};
export const AlertStatus = {
    OPEN: "OPEN",
    ACKNOWLEDGED: "ACKNOWLEDGED",
    RESOLVED: "RESOLVED",
    AUTO_RESOLVED: "AUTO_RESOLVED",
};
export const AlertResolution = {
    ACTION_TAKEN: "ACTION_TAKEN",
    CHECKED_OK: "CHECKED_OK",
    FALSE_ALARM: "FALSE_ALARM",
    OTHER: "OTHER",
};
export const AlertFeedback = {
    USEFUL: "USEFUL",
    NOT_NEEDED: "NOT_NEEDED",
};
export const DeliveryChannel = {
    PUSH: "PUSH",
    DIGEST_PUSH: "DIGEST_PUSH",
};
