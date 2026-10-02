import { pgTable, text, timestamp, uuid, boolean, integer, date, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role", { enum: ["CAREGIVER", "ELDERLY"] }).notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const elderlyProfiles = pgTable("elderly_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  dateOfBirth: date("date_of_birth"),
  checkinWindowStart: text("checkin_window_start").default("07:00").notNull(),
  checkinWindowEnd: text("checkin_window_end").default("11:00").notNull(),
  timezone: text("timezone").default("Asia/Kolkata").notNull(),
  notes: text("notes"),
});

export const careRelationships = pgTable("care_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  caregiverId: uuid("caregiver_id").references(() => users.id).notNull(),
  elderlyId: uuid("elderly_id").references(() => users.id).notNull(),
  isPrimary: boolean("is_primary").default(false),
  relationshipLabel: text("relationship_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const medications = pgTable("medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  elderlyId: uuid("elderly_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  strength: text("strength"),
  form: text("form"),
  instructions: text("instructions"),
  active: boolean("active").default(true).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const medicationSchedules = pgTable("medication_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  medicationId: uuid("medication_id").references(() => medications.id).notNull(),
  localTime: text("local_time").notNull(),
  daysOfWeek: integer("days_of_week").array().notNull().default(sql`'{0,1,2,3,4,5,6}'`),
  doseText: text("dose_text").notNull(),
  graceMinutes: integer("grace_minutes").default(30).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  active: boolean("active").default(true).notNull(),
});

export const scheduledDoses = pgTable(
  "scheduled_doses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("schedule_id").references(() => medicationSchedules.id).notNull(),
    medicationId: uuid("medication_id").notNull(),
    elderlyId: uuid("elderly_id").references(() => users.id).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    graceDeadline: timestamp("grace_deadline", { withTimezone: true }).notNull(),
    status: text("status", { enum: ["SCHEDULED", "TAKEN", "MISSED"] }).default("SCHEDULED").notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedVia: text("resolved_via", { enum: ["UI", "NFC", "SYSTEM"] }),
    wasLate: boolean("was_late").default(false).notNull(),
  },
  (table) => ({
    uniqueScheduleDue: uniqueIndex("scheduled_doses_schedule_id_due_at_unique").on(table.scheduleId, table.dueAt),
  })
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    elderlyId: uuid("elderly_id").references(() => users.id).notNull(),
    type: text("type", {
      enum: [
        "MEDICATION_TAKEN",
        "MEDICATION_MISSED",
        "ALERT_CREATED",
        "ALERT_ESCALATED",
        "ALERT_ACKNOWLEDGED",
        "ALERT_RESOLVED",
        "ALERT_AUTO_RESOLVED",
      ],
    }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    source: text("source", { enum: ["UI", "NFC", "SYSTEM", "CAREGIVER"] }).notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    refType: text("ref_type"),
    refId: uuid("ref_id"),
    payload: jsonb("payload").default({}).notNull(),
    clientEventId: uuid("client_event_id"),
  },
  (table) => ({
    uniqueClientEvent: uniqueIndex("events_elderly_id_client_event_id_unique").on(table.elderlyId, table.clientEventId),
  })
);

export const riskAssessments = pgTable("risk_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  elderlyId: uuid("elderly_id").references(() => users.id).notNull(),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).defaultNow().notNull(),
  triggerEventId: uuid("trigger_event_id").references(() => events.id),
  level: text("level", { enum: ["NORMAL", "LOW", "MEDIUM", "HIGH", "EMERGENCY"] }).notNull(),
  hits: jsonb("hits").default([]).notNull(),
  rulesetVersion: text("ruleset_version").notNull(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  elderlyId: uuid("elderly_id").references(() => users.id).notNull(),
  kind: text("kind", { enum: ["CONCERN", "SOS"] }).notNull(),
  level: text("level", { enum: ["NORMAL", "LOW", "MEDIUM", "HIGH", "EMERGENCY"] }).notNull(),
  peakLevel: text("peak_level", { enum: ["NORMAL", "LOW", "MEDIUM", "HIGH", "EMERGENCY"] }).notNull(),
  status: text("status", { enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED", "AUTO_RESOLVED"] }).default("OPEN").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  reasons: jsonb("reasons").default([]).notNull(),
  dedupeKey: text("dedupe_key"),
  assessmentId: uuid("assessment_id").references(() => riskAssessments.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  acknowledgedBy: uuid("acknowledged_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolution: text("resolution", { enum: ["ACTION_TAKEN", "CHECKED_OK", "FALSE_ALARM", "OTHER"] }),
  feedback: text("feedback", { enum: ["USEFUL", "NOT_NEEDED"] }),
  note: text("note"),
});
