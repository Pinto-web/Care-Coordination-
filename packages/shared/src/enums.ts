export const Role = {
  CAREGIVER: "CAREGIVER",
  ELDERLY: "ELDERLY",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const DoseStatus = {
  SCHEDULED: "SCHEDULED",
  TAKEN: "TAKEN",
  MISSED: "MISSED",
} as const;
export type DoseStatus = (typeof DoseStatus)[keyof typeof DoseStatus];

export const ResolvedVia = {
  UI: "UI",
  NFC: "NFC",
  SYSTEM: "SYSTEM",
} as const;
export type ResolvedVia = (typeof ResolvedVia)[keyof typeof ResolvedVia];

export const EventType = {
  MEDICATION_TAKEN: "MEDICATION_TAKEN",
  MEDICATION_MISSED: "MEDICATION_MISSED",
  ALERT_CREATED: "ALERT_CREATED",
  ALERT_ESCALATED: "ALERT_ESCALATED",
  ALERT_ACKNOWLEDGED: "ALERT_ACKNOWLEDGED",
  ALERT_RESOLVED: "ALERT_RESOLVED",
  ALERT_AUTO_RESOLVED: "ALERT_AUTO_RESOLVED",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const AlertKind = {
  CONCERN: "CONCERN",
  SOS: "SOS",
} as const;
export type AlertKind = (typeof AlertKind)[keyof typeof AlertKind];

export const AlertLevel = {
  NORMAL: "NORMAL",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  EMERGENCY: "EMERGENCY",
} as const;
export type AlertLevel = (typeof AlertLevel)[keyof typeof AlertLevel];

export const AlertStatus = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED",
  AUTO_RESOLVED: "AUTO_RESOLVED",
} as const;
export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];

export const AlertResolution = {
  ACTION_TAKEN: "ACTION_TAKEN",
  CHECKED_OK: "CHECKED_OK",
  FALSE_ALARM: "FALSE_ALARM",
  OTHER: "OTHER",
} as const;
export type AlertResolution = (typeof AlertResolution)[keyof typeof AlertResolution];

export const AlertFeedback = {
  USEFUL: "USEFUL",
  NOT_NEEDED: "NOT_NEEDED",
} as const;
export type AlertFeedback = (typeof AlertFeedback)[keyof typeof AlertFeedback];

export const DeliveryChannel = {
  PUSH: "PUSH",
  DIGEST_PUSH: "DIGEST_PUSH",
} as const;
export type DeliveryChannel = (typeof DeliveryChannel)[keyof typeof DeliveryChannel];
