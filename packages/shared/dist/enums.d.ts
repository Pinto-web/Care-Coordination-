export declare const Role: {
    readonly CAREGIVER: "CAREGIVER";
    readonly ELDERLY: "ELDERLY";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const DoseStatus: {
    readonly SCHEDULED: "SCHEDULED";
    readonly TAKEN: "TAKEN";
    readonly MISSED: "MISSED";
};
export type DoseStatus = (typeof DoseStatus)[keyof typeof DoseStatus];
export declare const ResolvedVia: {
    readonly UI: "UI";
    readonly NFC: "NFC";
    readonly SYSTEM: "SYSTEM";
};
export type ResolvedVia = (typeof ResolvedVia)[keyof typeof ResolvedVia];
export declare const EventType: {
    readonly MEDICATION_TAKEN: "MEDICATION_TAKEN";
    readonly MEDICATION_MISSED: "MEDICATION_MISSED";
    readonly ALERT_CREATED: "ALERT_CREATED";
    readonly ALERT_ESCALATED: "ALERT_ESCALATED";
    readonly ALERT_ACKNOWLEDGED: "ALERT_ACKNOWLEDGED";
    readonly ALERT_RESOLVED: "ALERT_RESOLVED";
    readonly ALERT_AUTO_RESOLVED: "ALERT_AUTO_RESOLVED";
};
export type EventType = (typeof EventType)[keyof typeof EventType];
export declare const AlertKind: {
    readonly CONCERN: "CONCERN";
    readonly SOS: "SOS";
};
export type AlertKind = (typeof AlertKind)[keyof typeof AlertKind];
export declare const AlertLevel: {
    readonly NORMAL: "NORMAL";
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly EMERGENCY: "EMERGENCY";
};
export type AlertLevel = (typeof AlertLevel)[keyof typeof AlertLevel];
export declare const AlertStatus: {
    readonly OPEN: "OPEN";
    readonly ACKNOWLEDGED: "ACKNOWLEDGED";
    readonly RESOLVED: "RESOLVED";
    readonly AUTO_RESOLVED: "AUTO_RESOLVED";
};
export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];
export declare const AlertResolution: {
    readonly ACTION_TAKEN: "ACTION_TAKEN";
    readonly CHECKED_OK: "CHECKED_OK";
    readonly FALSE_ALARM: "FALSE_ALARM";
    readonly OTHER: "OTHER";
};
export type AlertResolution = (typeof AlertResolution)[keyof typeof AlertResolution];
export declare const AlertFeedback: {
    readonly USEFUL: "USEFUL";
    readonly NOT_NEEDED: "NOT_NEEDED";
};
export type AlertFeedback = (typeof AlertFeedback)[keyof typeof AlertFeedback];
export declare const DeliveryChannel: {
    readonly PUSH: "PUSH";
    readonly DIGEST_PUSH: "DIGEST_PUSH";
};
export type DeliveryChannel = (typeof DeliveryChannel)[keyof typeof DeliveryChannel];
//# sourceMappingURL=enums.d.ts.map