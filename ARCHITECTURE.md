# Care Coordination Platform: Architecture

Status: **Proposal for approval.** Nothing here should be implemented until the items in Section 0 are confirmed.
Audience: the project team and the coding agent (OpenCode).
Scope: final-year B.Tech project. Practical, explainable, demonstrable. Not a production healthcare system.

---

## 0. Read this first

### 0.1 Decisions that need your approval

These change the plan from the handover document or fill gaps in it. Each has a recommendation; none are implemented until approved.

| # | Issue | Recommendation |
|---|-------|----------------|
| D1 | **Expo Go is not enough.** Remote push is unavailable in Expo Go on Android from SDK 53, and NFC needs native code Expo Go does not ship. | Build an Android **development build** in Milestone 0 and use it for the rest of the project. Expo Go remains usable only for screens that need neither push nor NFC. |
| D2 | One app for both roles vs. separate apps. | **One Expo app**, role-based route groups. Caregiver screens avoid native-only modules so they can also run via `expo start --web` as a laptop demo view. Revisit only if the dev-build workflow proves painful (Section 17, AD-1). |
| D3 | The spec offers only "I'm Okay" for check-in. A check-in with one possible answer carries little signal. | Add a second button, **"Not feeling well"**. It is a self-report, not a diagnosis. Rules treat it as a MEDIUM concern. |
| D4 | The spec lets ML decide how alerts are prioritized but also forbids ML from suppressing safety alerts. | ML has authority **only over delivery timing of LOW and MEDIUM alerts** (send now vs. hold for digest). HIGH and EMERGENCY are never ML-controlled. ML output for HIGH is logged in shadow mode only. |
| D5 | ML needs a label. "Caregiver acknowledged" is a weak proxy (ignoring may mean busy, not "unimportant"). | Add a one-tap **"Useful / Not needed"** feedback when the caregiver resolves an alert. This is the primary real-world label. Synthetic data simulates it. |
| D6 | Who creates medications and schedules? Not stated. | **Caregiver configures** medications and schedules remotely. The elderly user only confirms. |
| D7 | How does an elderly person log in? Passwords are a poor fit. | Caregiver creates the elderly profile; the elderly device **pairs with a one-time code**. Elderly users never handle a password. |
| D8 | Milestone order: event history is Milestone 8 but everything earlier writes events. | Move the event log to **Milestone 3**. Reordered list in Section 15. |
| D9 | Malayalam UI. The users are in Kerala. | Use i18n keys from day one; ship **English + Malayalam for the elderly side**. Caregiver side English only. |
| D10 | SOS "calling/location" feasibility. | No automated calls or SMS. SOS = push to all caregivers + repeated re-notification + one-tap **call** buttons (dialer deep link) + best-effort location. Reasons in Section 9. |
| D11 | Secondary caregivers. | Schema supports many caregivers per elderly person. UI for inviting a second caregiver is a **stretch goal** (Milestone 10b). Escalation to a secondary caregiver is only demonstrable once it exists. |
| D12 | Order NFC tags now. | Tags are cheap, but shipping and hardware surprises are schedule risks. Order 5-10 **NTAG213** stickers this week, even though NFC integration is a late milestone. |

### 0.2 The central idea, stated as architecture

```
Facts about the elderly person's day  ->  events (append-only)
Events + recent history               ->  rule engine: "what is happening, how concerning?"   (deterministic, explainable)
Rule output                           ->  alert coordinator: one consolidated "care situation" per person
Alert + caregiver history             ->  ML prioritizer: "interrupt now, or hold for digest?" (LOW/MEDIUM only)
Caregiver response + feedback         ->  events -> training data
```

Three properties to protect in every design choice:

1. **The rule engine owns safety.** ML can never suppress, downgrade or delay an EMERGENCY or HIGH alert.
2. **Every alert explains itself** in plain language, from structured rule evidence.
3. **Input mechanisms are adapters.** Button, NFC, or anything later all produce the same domain operation.

---

## 1. High-level system architecture

A **modular monolith** plus one small Python service for ML inference. No broker, no microservices.

```
                ┌──────────────────────────────────────────┐
                │        Expo app (React Native, TS)       │
                │  (elderly)/ routes      (caregiver)/ routes │
                └───────┬───────────────────────▲──────────┘
                        │ HTTPS REST (JWT)      │ Expo push (FCM)
                        ▼                       │
┌───────────────────────────────────────────────┴──────────────────────┐
│                     Backend: Node + Express + TypeScript              │
│                                                                        │
│  HTTP layer:  routes -> validation (zod) -> auth/authz middleware      │
│                                                                        │
│  Domain modules:  auth | care-circle | medication | wellness | sos     │
│                   events | coordination | notifications | scheduler    │
│                                                                        │
│  ┌──────────────────────── care-engine (pure TS library) ───────────┐ │
│  │ CareContext types | rules | assess() | feature extraction         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────┬────────────────────────┘
           │                                   │ HTTP, 300 ms timeout,
           ▼                                   │ fallback to baseline
    ┌─────────────┐                            ▼
    │ PostgreSQL  │                   ┌─────────────────┐
    └─────────────┘                   │  ml-service     │
                                      │  Python/FastAPI │
                                      │  loads .joblib  │
                                      └─────────────────┘

Offline tooling (same repo, not part of the running system):
  tools/simulator (TS, reuses care-engine)  ->  ml/data/*.csv  ->  ml/train.py  ->  ml/models/*.joblib
```

Why these boundaries:

- **care-engine is a pure library** (no DB, no HTTP). It is unit-testable with table-driven tests, reusable by the simulator, and easy to show in a review ("this is the brain; here are its tests").
- **ML is a separate process** only because scikit-learn lives in Python. It is stateless: features in, score out. If it is down, the system behaves exactly like the rule-only baseline.
- **Feature extraction lives in TypeScript**, not Python. The same code produces features for live inference, simulation and training export, which prevents train/serve skew.

---

## 2. Mobile architecture

### 2.1 Stack

Expo (latest stable SDK at project start; SDK 57 is current per Expo's docs), TypeScript, **expo-router** (file-based routing, close to Next.js conventions and therefore familiar to a React web developer), **TanStack Query** for server state, plain `StyleSheet` with a `theme.ts` token file. No Redux, no UI kit, no chart library.

### 2.2 Route structure and role separation

```
app/
  _layout.tsx              root: loads session, redirects by role
  (auth)/
    login.tsx              caregiver login/register
    pair.tsx               elderly device: enter pairing code
  (elderly)/
    _layout.tsx            no tab bar, big header
    index.tsx              HOME: status, next dose, check-in, SOS
    medicines.tsx          today's list, large rows
    sos.tsx                hold-to-confirm + countdown + sent state
  (caregiver)/
    _layout.tsx            tabs: Overview | Alerts | Medications | Settings
    index.tsx              overview for selected elderly person
    alerts/index.tsx
    alerts/[id].tsx        explanation, related events, actions, feedback
    history.tsx            timeline + adherence
    medications/...        CRUD for medications and schedules
    elderly/new.tsx        create elderly profile + pairing code
```

Role guard: the root layout reads the role from the stored session and redirects. The **server** still enforces everything; client guards are UX only.

### 2.3 Internal layering

```
src/
  api/          typed fetch client, one file per resource, types from packages/shared
  features/     per feature: hooks (useNextDose, useAlerts...) + feature components
  components/ui Button, Card, Text, Screen, StatusBadge (the small design system)
  i18n/         en.json, ml.json, setup
  lib/          auth storage, offline queue, notifications, nfc (later), time formatting
  theme.ts
```

Rules:
- **No business logic in the app.** The app never computes risk, adherence verdicts or alert text. It renders what the server returns (including `explanation` strings).
- Server state via TanStack Query (`refetchInterval` on dashboard screens). No global store. Session lives in one React context.
- Forms: `react-hook-form` + the **same zod schemas** as the backend (from `packages/shared`).

### 2.4 Elderly UX constraints (design checklist)

- Minimum body text 20sp, primary buttons at least 64dp tall, high contrast, respects system font scaling.
- At most one primary action per screen state. Home shows: greeting, one status sentence, **next medicine card with a large TAKEN button**, check-in card, SOS.
- SOS is always visible and visually distinct, never adjacent to the TAKEN button.
- Malayalam strings must be reviewed on a real device (font rendering, line wrapping). Do not rely on emulator screenshots.

### 2.5 Offline behaviour (minimal)

The elderly phone may have weak connectivity. Implement a small **retry queue** (AsyncStorage) for three actions: dose confirmation, check-in, SOS. Each carries a client-generated `clientEventId` (UUID) and a device `occurredAt`. The UI must show an unambiguous state for SOS: *Sending / Sent / Not sent, tap to retry or call*. Nothing more elaborate than this.

---

## 3. Backend architecture

### 3.1 Style

Modular monolith, three layers per module. No dependency injection framework, no repository interfaces for their own sake.

```
route  ->  service  ->  repository (Drizzle queries)
 |            |
 zod          business rules, transactions, authorization checks
```

### 3.2 Modules

| Module | Responsibility |
|--------|----------------|
| `auth` | register/login, refresh rotation, elderly pairing, device registration |
| `care-circle` | elderly profiles, caregiver relationships, settings |
| `medication` | medications, schedules, dose materialization, dose confirmation, adherence queries |
| `wellness` | daily check-in rows, completion, misses |
| `sos` | SOS fast path (separate from ordinary alerting) |
| `events` | append-only event log, timeline queries |
| `coordination` | context builder, risk assessment persistence, alert coordinator, prioritizer adapter |
| `notifications` | push sending, receipts, delivery records, digest |
| `scheduler` | periodic tick: materialize, detect misses, timers, retries |

### 3.3 The one pattern that holds it together

Every state change that matters follows the same shape, in **one DB transaction**, then a coordination step after commit:

```ts
// inside a service method
const event = await db.transaction(async (tx) => {
  await doseRepo.markTaken(tx, dose.id, ...);          // update state table
  return eventLog.append(tx, { type: 'MEDICATION_TAKEN', ... }); // append fact
});
await coordinator.handle(event);                        // rules -> alerts -> delivery
```

State tables answer "what is true now". The event log answers "what happened and when". This is **not** full event sourcing: state tables are not rebuilt from events. That keeps the code understandable.

Explicit function calls are used instead of an internal event emitter. They are easier to trace in a debugger and easier to explain in a review.

### 3.4 Scheduler (no job queue)

A single in-process loop, `setInterval` every 60 s with an overlap guard. All work is expressed as **idempotent queries**, so a restart or a missed tick loses nothing:

```
tick(now):
  1. materialize doses for next 48 h and today's check-in rows   (INSERT ... ON CONFLICT DO NOTHING)
  2. doses: status=SCHEDULED AND grace_deadline < now  -> MISSED + MEDICATION_MISSED event -> coordinator
  3. check-ins: PENDING AND window_end < now          -> MISSED + WELLNESS_CHECKIN_MISSED event -> coordinator
  4. alert timers: unacknowledged SOS/HIGH re-notify, escalate to secondary, digest flush
  5. delivery retries: alert_deliveries PENDING/FAILED with attempts < N
```

All time comparisons use an injected `Clock` (`SystemClock` in prod, `FakeClock` in tests and demos). Section 12.4 explains why this matters for demonstrations.

If reliability needs grow later, `pg-boss` (Postgres-backed queue) is the upgrade path. It is not needed now.

### 3.5 Processing model: what is synchronous

| Path | Mode |
|------|------|
| User action -> event -> coordinator -> alert creation | Synchronous up to *creating* the alert and delivery rows. Response returns after commit. |
| Push sending | Attempted immediately after commit, **outside** the request's critical path; failures are retried by the scheduler tick. |
| Missed-dose/check-in detection, escalations, digest | Scheduler-driven (asynchronous to users, but just a loop in the same process). |
| SOS | Dedicated fast path (Section 9). Never waits on rules or ML. |

---

## 4. Database design

PostgreSQL 15+. Conventions: `uuid` primary keys (`gen_random_uuid()`), `timestamptz` everywhere (UTC), enums as `text` with `CHECK` constraints (easier to migrate than native enums), `jsonb` only for evidence/payload/feature snapshots.

### 4.1 Tables

```sql
-- IDENTITY -------------------------------------------------------------
users (
  id uuid pk,
  role text check (role in ('CAREGIVER','ELDERLY')),
  full_name text not null,
  email text unique,               -- caregivers
  password_hash text,              -- caregivers only; null for elderly
  phone text,
  language text default 'en',      -- 'en' | 'ml'
  timezone text not null default 'Asia/Kolkata',
  created_by uuid references users(id),   -- caregiver who created an elderly profile
  created_at timestamptz default now()
)

elderly_profiles (
  user_id uuid pk references users(id),
  date_of_birth date,
  checkin_window_start time not null default '07:00',   -- elderly local time
  checkin_window_end   time not null default '11:00',
  notes text
)

care_relationships (
  id uuid pk,
  caregiver_id uuid references users(id),
  elderly_id uuid references users(id),
  is_primary boolean default false,
  relationship_label text,          -- 'Son', 'Daughter'...
  created_at timestamptz default now(),
  unique (caregiver_id, elderly_id)
)

devices (
  id uuid pk, user_id uuid references users(id),
  platform text, push_token text, push_token_active boolean default true,
  last_seen_at timestamptz, revoked_at timestamptz
)

refresh_tokens (id uuid pk, user_id uuid, device_id uuid, token_hash text, expires_at timestamptz, revoked_at timestamptz)

pairing_codes (
  id uuid pk, elderly_id uuid references users(id), created_by uuid,
  code_hash text not null, expires_at timestamptz not null, used_at timestamptz,
  failed_attempts int default 0
)

-- MEDICATION -----------------------------------------------------------
medications (
  id uuid pk, elderly_id uuid references users(id),
  name text not null, strength text, form text, instructions text,
  active boolean default true, created_by uuid, created_at timestamptz default now()
)

medication_schedules (             -- ONE ROW PER TIME OF DAY
  id uuid pk, medication_id uuid references medications(id),
  local_time time not null,        -- in the ELDERLY person's timezone
  days_of_week smallint[] not null default '{1,2,3,4,5,6,7}',
  dose_text text not null,         -- '1 tablet'
  grace_minutes int not null default 30,
  start_date date not null, end_date date,
  active boolean default true
)

scheduled_doses (                  -- MATERIALIZED, rolling 48 h
  id uuid pk,
  schedule_id uuid references medication_schedules(id),
  medication_id uuid, elderly_id uuid,
  due_at timestamptz not null,
  grace_deadline timestamptz not null,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','TAKEN','MISSED')),
  resolved_at timestamptz,
  resolved_via text check (resolved_via in ('UI','NFC','SYSTEM')),
  was_late boolean default false,  -- taken after being marked MISSED
  unique (schedule_id, due_at)
)
-- index: (elderly_id, due_at), partial index (status, grace_deadline) where status='SCHEDULED'

nfc_tags (                         -- table created in Milestone 12
  id uuid pk, elderly_id uuid, medication_id uuid references medications(id),
  tag_uid text not null, label text, active boolean default true,
  unique (elderly_id, tag_uid)
)

-- WELLNESS -------------------------------------------------------------
daily_checkins (
  id uuid pk, elderly_id uuid, local_date date not null,
  window_start timestamptz not null, window_end timestamptz not null,
  status text not null default 'PENDING' check (status in ('PENDING','COMPLETED','MISSED')),
  response text check (response in ('OKAY','NOT_WELL')),
  completed_at timestamptz,
  unique (elderly_id, local_date)
)

-- EVENT LOG (append-only) ----------------------------------------------
events (
  id uuid pk,
  elderly_id uuid not null references users(id),
  type text not null,
  occurred_at timestamptz not null,       -- when it happened (device time, clamped)
  recorded_at timestamptz not null default now(),
  source text not null check (source in ('UI','NFC','SYSTEM','CAREGIVER')),
  actor_user_id uuid references users(id),
  ref_type text, ref_id uuid,             -- e.g. ('scheduled_dose', id)
  payload jsonb not null default '{}',
  client_event_id uuid,                   -- idempotency for device-originated events
  unique (elderly_id, client_event_id)
)
-- indexes: (elderly_id, occurred_at desc), (elderly_id, type, occurred_at desc)

-- COORDINATION ---------------------------------------------------------
risk_assessments (                 -- rule engine output log, one per evaluation
  id uuid pk, elderly_id uuid, evaluated_at timestamptz,
  trigger_event_id uuid references events(id),
  level text check (level in ('NORMAL','LOW','MEDIUM','HIGH','EMERGENCY')),
  hits jsonb not null,             -- [{ruleId, level, evidence}]
  ruleset_version text not null
)

alerts (
  id uuid pk, elderly_id uuid not null,
  kind text check (kind in ('SOS','CONCERN')),
  level text, peak_level text,
  status text default 'OPEN' check (status in ('OPEN','ACKNOWLEDGED','RESOLVED','AUTO_RESOLVED')),
  title text not null,
  summary text not null,            -- human-readable explanation
  reasons jsonb not null,           -- [{ruleId, text, evidence}]
  dedupe_key text,                  -- one open CONCERN per elderly person
  assessment_id uuid references risk_assessments(id),
  created_at timestamptz default now(), updated_at timestamptz,
  acknowledged_at timestamptz, acknowledged_by uuid,
  resolved_at timestamptz, resolved_by uuid,
  resolution text check (resolution in ('ACTION_TAKEN','CHECKED_OK','FALSE_ALARM','OTHER')),
  feedback text check (feedback in ('USEFUL','NOT_NEEDED')),
  note text
)
-- unique partial index: (elderly_id) where kind='CONCERN' and status in ('OPEN','ACKNOWLEDGED')

alert_prioritizations (            -- also the ML training/audit table
  id uuid pk, alert_id uuid references alerts(id), caregiver_id uuid,
  decided_at timestamptz, mode text check (mode in ('RULES_ONLY','SHADOW','ACTIVE')),
  model_version text, feature_schema_version text,
  features jsonb not null,         -- exact vector used
  score real,                      -- P(actionable), null if ML not consulted
  decision text check (decision in ('NOTIFY_NOW','DIGEST')),
  baseline_decision text           -- what the rules-only policy would have done
)

alert_deliveries (
  id uuid pk, alert_id uuid, caregiver_id uuid,
  channel text check (channel in ('PUSH','DIGEST_PUSH')),
  status text default 'PENDING' check (status in ('PENDING','SENT','FAILED','DEAD')),
  attempts int default 0, expo_ticket_id text, error text,
  created_at timestamptz default now(), sent_at timestamptz
)
```

### 4.2 Design notes

- **Schedules vs. doses.** A *schedule* is configuration ("08:00 daily, 1 tablet"). A *scheduled dose* is one concrete occurrence. Doses are materialized ahead (48 h) by the scheduler, idempotently through the `(schedule_id, due_at)` unique key. Adherence is computed from `scheduled_doses`, never from free-form history.
- **Time handling.** Schedules are stored in the **elderly person's** local time (`Asia/Kolkata`). Conversion to UTC happens at materialization (use Luxon). A caregiver in another time zone sees both: "8:00 AM IST (their time)". India has no DST, but the caregiver may be in a country that does; UTC storage makes this a display concern only.
- **One open concern per person.** The partial unique index enforces the "care situation" idea: new signals update the existing open alert instead of spawning a new one. This is the deterministic half of alert-fatigue reduction.
- **`alert_prioritizations` stores the feature vector used.** That single table is the future training set and the audit trail for ML decisions.
- **Retention.** Keep everything for the project; no deletion logic beyond an account-delete endpoint.

---

## 5. User, role and relationship model

```
users(role=CAREGIVER) ──< care_relationships >── users(role=ELDERLY) ── elderly_profiles
        │                     (is_primary)                │
        └── devices (push tokens)                         └── devices (paired phone)
```

- One role per user. A caregiver account has credentials; an elderly account has **no password** and is created by a caregiver (`created_by`).
- Many-to-many between caregivers and elderly people at the schema level. UI for the MVP assumes the common case (one elderly person) but the caregiver app should still render a list of linked people (it costs almost nothing and avoids rework).
- Exactly one `is_primary` caregiver per elderly person. The primary receives first notification; others are used for escalation.

### Onboarding flow

```
Caregiver registers ─> creates elderly profile ─> app shows 6-digit pairing code (10 min, single use)
Elderly phone: opens app ─> "Enter code" ─> POST /auth/pair ─> device token (role ELDERLY, bound to that person)
```

The caregiver can do this in person during setup, which is the realistic scenario for elderly users.

---

## 6. API structure

REST, JSON, prefix `/api/v1`. Resource-oriented. All request bodies validated with zod schemas from `packages/shared`. Standard error shape `{ error: { code, message, details? } }`. Every mutating device-originated call accepts `clientEventId` for idempotency.

### Auth
```
POST /auth/register            caregiver
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/pair                elderly device + pairing code -> tokens
PUT  /devices/me               register/update push token
```

### Care circle (caregiver)
```
GET   /elderly                          linked elderly people
POST  /elderly                          create profile + relationship
GET   /elderly/:id
PATCH /elderly/:id                      timezone, check-in window, name
POST  /elderly/:id/pairing-codes
```

### Medication configuration (caregiver)
```
GET/POST   /elderly/:id/medications
PATCH      /medications/:id             (incl. deactivate)
POST       /medications/:id/schedules
PATCH/DEL  /schedules/:id
```

### Elderly device ("me" endpoints, scoped to the token's own person)
```
GET  /me/home                           one aggregated payload for the home screen
GET  /me/doses?from&to
POST /me/medication-confirmations       body: { doseId? | medicationId? | tagUid?, source: 'UI'|'NFC', occurredAt, clientEventId }
GET  /me/checkin/today
POST /me/checkins                       body: { response: 'OKAY'|'NOT_WELL', occurredAt, clientEventId }
POST /me/sos                            body: { occurredAt, clientEventId, location? }
POST /me/sos/:id/cancel
```

`/me/medication-confirmations` is deliberately the only entry point for "I took it". The server resolves which dose is meant from `doseId`, or from `medicationId`/`tagUid` plus the nearest due dose. `source` is recorded and nothing else depends on it.

### Caregiver dashboard
```
GET  /elderly/:id/status                current assessment, today's doses, today's check-in, open alerts
GET  /elderly/:id/adherence?days=7|30
GET  /elderly/:id/timeline?from&to&types
GET  /alerts?status=&elderlyId=
GET  /alerts/:id                        reasons, related events, delivery note
POST /alerts/:id/acknowledge
POST /alerts/:id/resolve                body: { resolution, feedback?, note? }
```

### Dev-only (guarded by `NODE_ENV !== 'production'`)
```
POST /dev/clock/advance    POST /dev/scenarios/:name    GET /health
```

---

## 7. Event model

### 7.1 Catalogue

| Event | Persisted? | Source | Created by | Processing |
|-------|-----------|--------|-----------|------------|
| `MEDICATION_TAKEN` | Yes | UI / NFC | confirmation endpoint | Sync: coordinator runs after commit |
| `MEDICATION_MISSED` | Yes | SYSTEM | scheduler at grace expiry | Coordinator runs from scheduler |
| `WELLNESS_CHECKIN_COMPLETED` | Yes (payload: response) | UI | check-in endpoint | Sync |
| `WELLNESS_CHECKIN_MISSED` | Yes | SYSTEM | scheduler at window end | Coordinator runs from scheduler |
| `SOS_TRIGGERED` | Yes | UI | SOS fast path | Dedicated fast path, Section 9 |
| `SOS_CANCELLED` | Yes | UI | elderly within short window | Fast path |
| `ALERT_CREATED` | Yes | SYSTEM | alert coordinator | n/a |
| `ALERT_ESCALATED` | Yes | SYSTEM | level raised on an existing alert | n/a |
| `ALERT_ACKNOWLEDGED` | Yes | CAREGIVER | caregiver action | Stops re-notify timers |
| `ALERT_RESOLVED` | Yes (payload: resolution, feedback) | CAREGIVER | caregiver action | Closes the alert |
| `ALERT_AUTO_RESOLVED` | Yes | SYSTEM | condition cleared (e.g. late dose) | n/a |

**Not events (by design):**

| Thing | Where it lives | Why |
|-------|---------------|-----|
| `MEDICATION_DUE` | a `scheduled_doses` row with status SCHEDULED | "Due" is a state, not something that happened. Reminders are notifications generated from it. |
| Risk level / "current status" | `risk_assessments` (derived, recomputable) | Derived data must not be mixed with facts. |
| Adherence percentages | SQL over `scheduled_doses` | Computed. |
| Notification send attempts | `alert_deliveries` | Operational detail. |
| ML scores | `alert_prioritizations` | Audit + training table. |

### 7.2 Why "missed" is an event

A missed dose is an absence, which nothing triggers naturally. The scheduler turns the absence into a timestamped fact, which means the rule engine, the timeline and the training export treat it like any other occurrence.

### 7.3 Late confirmation

If the user taps TAKEN after the dose was marked MISSED (allowed until the next dose for that medication or 4 hours, whichever is sooner): dose becomes `TAKEN` with `was_late = true`, a `MEDICATION_TAKEN` event is recorded with `payload.late = true`, and the coordinator re-evaluates. The original `MEDICATION_MISSED` event is **not** deleted; history stays truthful.

### 7.4 Event history becomes training data

`events` + `alerts` + `alert_prioritizations` together contain: what happened, what the rules concluded, what the prioritizer saw and decided, and how the caregiver responded. `tools/export-training-data.ts` joins these into the same CSV schema the simulator produces.

---

## 8. Rule-engine architecture

### 8.1 Shape

A **pure function** in `packages/care-engine`:

```ts
assess(ctx: CareContext, config: RuleConfig): RiskAssessment

type CareContext = {
  now: Date;
  timezone: string;
  doses:      { id: string; dueAt: Date; status: 'TAKEN'|'MISSED'|'SCHEDULED'; wasLate: boolean }[];  // last 7 days
  checkins:   { localDate: string; status: 'COMPLETED'|'MISSED'|'PENDING'; response?: 'OKAY'|'NOT_WELL' }[]; // last 7 days
  sosActive: boolean;
};

type RuleHit = { ruleId: string; level: Level; text: string; evidence: Record<string, unknown> };
type RiskAssessment = { level: Level; hits: RuleHit[]; rulesetVersion: string };
```

`ContextBuilder` (in the backend, because it queries the DB) builds `CareContext`. Rules never touch the database. Each rule is a small object `{ id, evaluate(ctx, config) -> RuleHit | null }`. Final level = the highest hit level; explicit combination rules exist for multi-signal cases rather than hidden weights.

### 8.2 Ruleset v1 (all thresholds in `RuleConfig`, none hard-coded)

| Rule ID | Condition | Level | Explanation text (template) |
|---------|-----------|-------|----------------------------|
| `MED_SINGLE_MISS` | exactly 1 missed dose in the last 24 h | LOW | "1 medication dose missed in the last 24 hours." |
| `MED_REPEATED_MISS` | >= 2 missed in 24 h, or >= 3 in 72 h | MEDIUM | "{n} medication doses missed in the last {window}." |
| `CHECKIN_MISSED` | today's check-in missed | LOW | "Daily check-in not completed today." |
| `CHECKIN_REPEATED_MISS` | >= 2 consecutive days missed | MEDIUM | "No check-in for {n} days in a row." |
| `CHECKIN_NOT_WELL` | latest check-in = NOT_WELL (D3) | MEDIUM | "Reported not feeling well at {time}." |
| `COMBO_MED_CHECKIN` | >= 1 missed dose in 24 h AND today's check-in missed | HIGH | "Missed medication and no check-in today." |
| `SOS_ACTIVE` | SOS unresolved | EMERGENCY | "SOS pressed at {time}." (handled by fast path; listed for completeness) |

Scenarios A-D from the handover map to LOW, MEDIUM, HIGH and EMERGENCY exactly. **They become the first four unit tests.**

### 8.3 Explanation output

Each hit carries `text` (for people) and `evidence` (for machines). The alert's `summary` is composed as:

> **Moderate concern.** 2 medication doses missed in the last 24 hours (Amlodipine 08:00, Metformin 13:00).

The alert detail screen lists each hit, with a link to the underlying events. No opaque scores are shown to the caregiver.

### 8.4 Persistence discipline

- Every evaluation writes a `risk_assessments` row (level, hits, `ruleset_version`).
- Bump `RULESET_VERSION` whenever rules or default thresholds change; training data then records which rules were live.
- Persisting assessments is what makes "current status" on the dashboard a simple read and gives the ML features a history of levels.

### 8.5 Persistence of escalation by time (deterministic)

An alert that stays unacknowledged gets re-notified or escalated by the scheduler using fixed timers (for example HIGH: re-notify at 15 min, escalate to secondary caregiver at 30 min). These are rules, not ML decisions. Timer values live in `RuleConfig`.

---

## 9. Alert architecture (including SOS)

### 9.1 Two distinct paths

```
                    ┌────────────── SOS FAST PATH ──────────────┐
elderly presses SOS │ persist event + alert(kind=SOS,EMERGENCY) │
(hold 2 s + 5 s     │ + delivery rows to ALL caregivers, one tx │ -> push immediately
 cancel window)     │ NO rules, NO ML, NO consolidation         │ -> re-notify every 60 s until acknowledged
                    └────────────────────────────────────────────┘

                    ┌────────────── CONCERN PATH ───────────────┐
any other event     │ context -> assess() -> reconcile alert    │
                    │ -> prioritize (ML, LOW/MEDIUM only)       │ -> deliver or digest
                    └────────────────────────────────────────────┘
```

The SOS path has **no dependency on the ML service, the rule engine or scheduler state**, so a failure elsewhere cannot delay it.

### 9.2 The "care situation" consolidation (deterministic, always on)

The coordinator keeps at most one open CONCERN alert per elderly person.

```
reconcile(assessment, openAlert):
  level NORMAL, openAlert exists  -> AUTO_RESOLVED (+ ALERT_AUTO_RESOLVED event)
  level > NORMAL, no openAlert    -> create alert (+ ALERT_CREATED)            -> needs notification decision
  level higher than openAlert     -> update, raise level, ALERT_ESCALATED      -> needs notification decision
  level same or lower             -> update reasons quietly, no new notification
```

Ten minutes of small signals therefore produce one evolving alert, not ten pushes.

### 9.3 Baseline delivery policy (rules only; this is what runs before any ML exists)

| Level | Delivery |
|-------|----------|
| LOW | In-app only, included in digest |
| MEDIUM | Push now |
| HIGH | Push now, timers to re-notify and escalate |
| EMERGENCY | Push now on max-importance channel, re-notify until acknowledged |

### 9.4 ML-adjusted delivery (LOW and MEDIUM only)

```
p = P(alert is actionable)        // from ML service
LOW:     p >= T_low  -> NOTIFY_NOW,  else DIGEST        (baseline was DIGEST: ML may promote)
MEDIUM:  p >= T_med  -> NOTIFY_NOW,  else DIGEST        (baseline was NOTIFY: ML may defer)
```

Guardrails, enforced in code outside the model:

1. Deferral is **never dropping.** Every alert stays visible in the dashboard with its true level.
2. Maximum deferral (for example 3 h LOW, 1 h MEDIUM), after which the digest flushes regardless of score.
3. Any level increase re-enters the decision; a MEDIUM that becomes HIGH bypasses ML.
4. ML unavailable, slow (> 300 ms) or erroring -> baseline policy, logged as `RULES_ONLY`.
5. The app shows *why* a delivery was held: "Held for your 6 PM summary (low priority)".

Modes via config: `ML_MODE=off | shadow | active`. **Shadow** logs the ML decision next to the baseline decision without acting on it. It is the safe way to gather evidence before enabling ML and is itself a good demo artifact.

### 9.5 Digest

The scheduler sends one summary push per caregiver at configured digest times (caregiver's timezone, for example 09:00 and 19:00) if deferred alerts exist, and flushes early when the maximum deferral passes.

### 9.6 Alert lifecycle

```
OPEN ──acknowledge──> ACKNOWLEDGED ──resolve(resolution, feedback?)──> RESOLVED
  └────────────── condition clears ──────────────────────────────────> AUTO_RESOLVED
```

Caregiver actions are recorded as events (`ALERT_ACKNOWLEDGED`, `ALERT_RESOLVED`). `feedback` (USEFUL / NOT_NEEDED) is optional but prompted with one tap (D5). SOS alerts cannot be auto-resolved; a caregiver must resolve them.

### 9.7 SOS feasibility and limits (D10)

| Capability | Decision | Reason |
|-----------|----------|--------|
| Push to caregivers | Yes | Core path; max-importance Android channel |
| Repeated re-notification | Yes | Mitigates a single missed push |
| Caregiver one-tap call buttons (dialer deep link) | Yes | No permissions, reliable |
| Elderly "Call 112 / caregiver" buttons on the SOS screen | Yes (dialer deep link) | The phone dialer is the right tool; do not automate it |
| Automated SMS/phone call | **No** | Indian SMS sending requires sender/template registration (DLT) and costs money; automated calls are out of scope |
| Location | Best effort | Foreground location permission when SOS is pressed; attach coordinates if quickly available; never block SOS on it |
| Works if the phone is offline | No | Show "Not sent" clearly and offer direct call buttons |

Include an honest on-screen/report disclaimer: this is an academic prototype, not a replacement for emergency services.

---

## 10. ML integration architecture

### 10.1 Purpose (keep this wording)

> Given a rule-generated alert and the caregiver's historical response behaviour, estimate whether the alert is likely to need prompt attention, in order to choose between immediate notification and a digest, reducing notification noise without touching safety-critical alerts.

The model does **not** predict whether a person is in danger, and the report should say so explicitly.

### 10.2 Problem definition

- **Unit:** one candidate notification decision (a new or escalated LOW/MEDIUM alert for one caregiver).
- **Target `y`:** *actionable* = 1 if the caregiver marked feedback `USEFUL`, or resolved with `ACTION_TAKEN`; 0 if feedback `NOT_NEEDED`, resolution `FALSE_ALARM`/`CHECKED_OK` with no action, or the alert auto-resolved without ever being acknowledged. Document this definition and its weaknesses.
- **Model output:** calibrated probability `p`. A thresholding policy (9.4) converts `p` to a decision. Thresholds are chosen on validation data to meet a stated recall target.

### 10.3 Features (computed in TypeScript, `care-engine/features.ts`)

```
Alert:       level_ordinal, n_rule_hits, has_med_signal, has_checkin_signal, is_escalation
Volume:      alerts_last_24h, alerts_last_7d, minutes_since_last_alert, n_open_unacked_alerts
Caregiver:   ack_rate_7d, ack_rate_30d, median_ack_minutes_30d, not_needed_rate_30d, escalations_last_7d
Time:        caregiver_local_hour, day_of_week, is_night
Elderly ctx: missed_doses_24h, missed_doses_7d, adherence_rate_7d, missed_checkins_7d, consecutive_missed_checkins
```

A `feature_schema.json` (name, type, order, version) is the contract. Backend, simulator and Python all validate against it.

### 10.4 Models

Train and compare on the same split: **logistic regression** (baseline, most explainable), **random forest**, and **gradient boosting** (`HistGradientBoostingClassifier` from scikit-learn, which avoids an XGBoost dependency). Select by PR-AUC and calibration (Brier score), with a preference for the simpler model when results are close. Explainability: logistic-regression coefficients or permutation importance; SHAP is optional.

### 10.5 Serving

```
ml/
  train.py             reads CSV, trains, evaluates, writes models/alert_prioritizer_vN.joblib + metrics.json
  serve/app.py         FastAPI: POST /score {features} -> {score, model_version}; GET /health
  feature_schema.json  (copied/generated from care-engine)
```

The backend's `Prioritizer` has two implementations behind one interface: `RulesOnlyPrioritizer` and `MlPrioritizer`. `MlPrioritizer` calls the service with a 300 ms timeout and falls back to rules on any failure.

### 10.6 Training data: honest framing

| Source | Use |
|--------|-----|
| **Synthetic** (`tools/simulator`) | Primary. Validates the pipeline and lets you study behaviour under controlled assumptions. |
| **Real pilot** (team families, with consent, optional) | Small, used for sanity checks and a qualitative appendix, not for claims of accuracy. |

The simulator generates elderly event streams and caregiver behaviour profiles (responsive, busy, ignores low-priority, night-unavailable, inconsistent), runs them through the **real** `assess()` and feature extractor, and emits labelled rows. Because labels come from assumed caregiver behaviour, results on synthetic data show that the pipeline works, **not** that the approach works for real caregivers. State this in the report. Split by **simulated caregiver** (group split) plus a temporal split to avoid leakage.

### 10.7 Evaluation plan

- Classification: PR-AUC, recall at chosen threshold, calibration curve.
- **Operational metric (the headline):** notifications reduced versus the rules-only baseline at a fixed recall of actionable alerts, per level.
- Baselines to beat: rules-only policy; "always notify MEDIUM"; a simple level-and-hour heuristic.
- Safety check: confirm by test that no EMERGENCY/HIGH alert is ever deferred.
- Shadow-mode replay on the real app data when available.

---

## 11. NFC integration architecture

### 11.1 Principle

NFC is an **input adapter** on the client. The domain operation is `confirm medication intake`, and only one server endpoint implements it.

```
 [TAKEN button] ─┐
 [NFC tag scan] ─┼─> confirmIntake({ doseId | medicationId | tagUid, source })
 [future input] ─┘            |
                              v
             POST /me/medication-confirmations
                              v
        MedicationService.confirmIntake() -> dose TAKEN -> MEDICATION_TAKEN event
```

Nothing in the rule engine, scheduler or dashboard knows or cares about `source`, apart from displaying it in the timeline.

### 11.2 Client structure

```
lib/medication-input/
  types.ts            interface MedicationInput { start(); stop(); onConfirm(cb) }
  manual.ts           button-driven (works today)
  nfc.ts              react-native-nfc-manager, foreground reading (added Milestone 12)
  dev-simulator.ts    dev-build-only "simulate tag tap" button for testing before tags arrive
```

### 11.3 Tag design

- **Identify by tag UID**, mapped to a medication in `nfc_tags`. Nothing needs to be written onto the tag, so blank NTAG213 stickers work immediately.
- Registration flow (caregiver or assisted on the elderly phone): *Medications -> pick medication -> "Link NFC tag" -> tap tag -> UID saved*.
- Scan flow: the elderly user opens the medicines screen; the phone reads a tag; the server resolves the nearest due dose for that medication and confirms it, or returns "No dose due now" so the UI can say so plainly.
- Scope it down: **foreground scanning only** for the project. Launching the app from a tap with the screen off needs NDEF records and intent filters, which is a stretch goal, not a requirement.
- UIDs can be cloned. Acceptable for this project; note it as a limitation.

### 11.4 Requirements

- Requires a **development build** (native module, plus manifest NFC permission through its config plugin), which is already mandated by D1.
- The elderly person's phone must have NFC and it must be enabled. Check support at startup and hide the NFC affordance otherwise.

---

## 12. Authentication and authorization

### 12.1 Authentication

| Item | Decision |
|------|----------|
| Caregiver login | Email + password, hashed with argon2id (or bcrypt if native builds are troublesome) |
| Tokens | Short-lived access JWT (15 min) + rotating refresh token; refresh tokens stored **hashed** in `refresh_tokens` |
| Elderly login | Pairing code -> long-lived device session (refresh token bound to the device). No password. |
| Client storage | `expo-secure-store` for tokens. (Note: SecureStore has no web implementation; wrap it in a small storage module with a web fallback if using the web demo.) |
| Logout / lost phone | Revoke the device's refresh tokens; caregiver can revoke the elderly device from settings |
| Abuse controls | `express-rate-limit` on `/auth/*` and especially `/auth/pair`; pairing codes single-use, 10-minute expiry, locked after 5 failed attempts |

### 12.2 Authorization

Relationship-based, enforced in the **service layer** through one policy helper, never ad hoc in routes.

```ts
assertCanAccessElderly(auth, elderlyId)
  // CAREGIVER: exists care_relationships(caregiver_id = auth.userId, elderly_id)
  // ELDERLY:   auth.userId === elderlyId
```

Endpoints keyed by a resource id (`/alerts/:id`, `/medications/:id`, `/schedules/:id`) first load the resource's `elderly_id`, then call the helper. Elderly tokens are additionally restricted to `/me/*`. Caregiver-only actions (configuring medications, resolving alerts) check role first.

**Mandatory tests:** a caregiver linked to person A gets 403/404 on person B's data across every endpoint; an elderly token cannot reach caregiver endpoints. These are cheap and high-value.

### 12.3 Privacy (one section for the report)

Medication and health-related data is sensitive, and India's DPDP Act 2023 is relevant to this kind of data. At project level: collect the minimum, show a consent screen during pairing, do not log PII, HTTPS in any hosted deployment, provide account/data deletion, and state that the system is not a medical device.

### 12.4 Clock injection (testing and demos)

All services take a `Clock`. `POST /dev/clock/advance` (dev only) moves a fake clock so a demo can show "30 minutes later, the dose is marked missed" in seconds. Without this, demonstrating missed-dose logic means waiting in the room.

---

## 13. Notification approach

| Notification | Mechanism | Notes |
|-------------|-----------|-------|
| Medication reminders (elderly) | **Local scheduled notifications** from the synced dose list (`expo-notifications`) | Works offline; no server push dependency. Reschedule on every sync for the next 48 h. Reminder at due time and again at +15 min. |
| Caregiver alerts | **Expo Push Service** from the backend (`expo-server-sdk`), through FCM on Android | Needs a dev build and FCM credentials. Tickets stored, receipts checked, `DeviceNotRegistered` tokens deactivated. |
| Digest | Same channel, separate Android notification channel | Low importance |
| In-app | Dashboard polling via TanStack Query (`refetchInterval` 15-30 s while foregrounded) | Fallback when push is delayed or unavailable |
| Real-time sockets | **Not used** | Polling plus push is enough and far simpler |

Android channels: `sos` (max importance, sound, bypass where permitted), `alerts` (high), `digest` (default), `reminders` (high).

Known platform issue: **battery optimisation on some Android vendors (Xiaomi, Oppo, Vivo and others) delays or kills local notifications and background pushes.** The setup flow should include a one-time "keep this app running" instruction page for the elderly phone. Test on the actual phone that will be used in the demo.

---

## 14. Project directory structure

npm workspaces monorepo. (npm is recommended over pnpm here because Expo monorepo support has historically been smoothest with it; confirm against current Expo docs in Milestone 0.)

```
care-coordination/
├── package.json                  # workspaces: apps/*, packages/*, tools/*
├── docker-compose.yml            # postgres, ml-service (optional), backend (optional)
├── docs/
│   ├── ARCHITECTURE.md           # this file
│   ├── rules.md                  # rule table, kept in sync with ruleset version
│   ├── api.md
│   └── ml-report-notes.md        # data provenance, label definition, limitations
├── apps/
│   ├── mobile/                   # Expo app
│   │   ├── app/                  # expo-router routes (Section 2.2)
│   │   └── src/{api,features,components,i18n,lib}/
│   └── backend/
│       ├── drizzle/              # SQL migrations
│       └── src/
│           ├── index.ts          # bootstrap: http server + scheduler
│           ├── config.ts         # env parsing (zod)
│           ├── clock.ts
│           ├── http/             # app.ts, middleware (auth, error, validate, rateLimit)
│           ├── db/               # client.ts, schema.ts
│           ├── modules/
│           │   ├── auth/         {routes,service,repo}.ts
│           │   ├── care-circle/
│           │   ├── medication/
│           │   ├── wellness/
│           │   ├── sos/
│           │   ├── events/       # eventLog.append(), timeline queries
│           │   ├── coordination/ # contextBuilder, coordinator, alertReconciler, prioritizer/
│           │   ├── notifications/# expoPush.ts, deliveryWorker.ts, digest.ts
│           │   └── scheduler/    # tick.ts, jobs/
│           └── __tests__/        # integration tests (supertest)
├── packages/
│   ├── shared/                   # zod schemas, API types, event type constants, enums
│   └── care-engine/              # PURE: rules/, assess.ts, features.ts, types.ts, config.ts (+ unit tests)
├── tools/
│   ├── simulator/                # synthetic event + caregiver behaviour generator (uses care-engine)
│   ├── export-training-data.ts
│   └── demo-scenarios.ts         # scripted scenarios for the live demo
└── ml/
    ├── data/                     # generated CSVs (gitignored)
    ├── models/
    ├── feature_schema.json
    ├── train.py
    ├── serve/app.py
    └── requirements.txt
```

If workspace friction appears (Metro resolution, TypeScript build steps), fall back to `apps/backend/src/engine/` with no DB imports. **The boundary matters more than the package.**

---

## 15. Development milestones (reordered)

Dependency logic: the event log and scheduler must exist before features that write events; the rule engine is pure and can be built in parallel with UI; the alert UI needs the coordinator; ML needs the simulator and the feedback loop.

| M | Milestone | Contents | Exit criteria |
|---|-----------|----------|---------------|
| **0** | **Tracer bullet** | Monorepo, docker Postgres, backend `/health`, Expo **dev build** on the Android phone, test push token round trip, NFC availability check, shared package wiring | Phone builds and runs; backend reachable from phone (LAN/tunnel); a test push arrives |
| **1** | Backend shell + DB | Config, migrations, error/validation middleware, `Clock`, test setup | Migrations run; one integration test passes |
| **2** | Users, auth, pairing | Caregiver register/login, elderly creation, pairing, refresh rotation, authorization helper | Both roles log in on the phone; cross-person access tests pass |
| **3** | **Event log + scheduler skeleton** | `events` table, `eventLog.append`, timeline endpoint, tick loop, fake clock endpoint | Events appear in a timeline; tick runs idempotently |
| **4** | Medication | Caregiver CRUD, materialization, elderly home + TAKEN, local reminders, missed detection (scheduler), adherence query | Dose goes SCHEDULED -> MISSED/TAKEN with events recorded |
| **5** | Wellness | Check-in rows, completion, misses, elderly check-in card | Check-in events recorded; misses detected |
| **6** | SOS | Fast path, deliveries, push, re-notify, call buttons, hold-to-confirm + cancel | SOS reaches caregiver phone within seconds; survives ML service being down |
| **7** | Caregiver dashboard (basic) | Status, adherence, timeline, medication management screens | Caregiver sees the elderly person's day accurately |
| **8** | **Rule engine** | `care-engine` rules + tests, context builder, `risk_assessments` | Scenarios A-D pass as tests; explanation text correct |
| **9** | **Alert system** | Reconciler, baseline delivery policy, digest, alert screens (explanation, acknowledge, resolve, feedback), escalation timers | End-to-end: missed events -> one consolidated alert -> push -> acknowledge |
| **10** | Demo tooling | `demo-scenarios`, fake-clock controls, seeded history. **10b (stretch):** secondary caregiver invite + escalation | A full scenario demoable in minutes |
| **11** | **ML** | Simulator, dataset, training/evaluation, `ml-service`, shadow mode, then active mode | Report-ready metrics; shadow comparison; guardrail tests pass |
| **12** | NFC | Tag registration, scan adapter, tag-to-dose resolution | Tag tap confirms a dose through the same endpoint |
| **13** | Hardening | Malayalam review on device, battery-optimisation guide, accessibility pass, hosting, demo rehearsal | Rehearsed demo on the real devices |

**Parallelisation for a team:** UI work (M4-M7) and the pure rule engine plus simulator (M8, M11 data) can proceed at the same time once `packages/shared` types and the `CareContext` type from M8 are agreed. Define those two contracts early.

---

## 16. Recommended technologies and libraries

### Backend
| Library | Why |
|---------|-----|
| `express`, `typescript`, `tsx` | Your stated choice; `tsx` for dev without build steps |
| `zod` | One validation library for API, config and shared contracts |
| `drizzle-orm` + `drizzle-kit` + `pg` | TypeScript-first, SQL-like, good support for partial indexes and check constraints (harder in Prisma's schema language). Prisma is an acceptable alternative if the team prefers it. |
| `luxon` | Reliable time zone conversion for schedule materialization |
| `jose` or `jsonwebtoken`, `argon2`/`bcrypt` | Auth |
| `helmet`, `express-rate-limit` | Basic hardening |
| `pino` | Structured logs (without PII) |
| `expo-server-sdk` | Expo push sending and receipts |
| `vitest`, `supertest` | Unit and integration tests |

### Mobile
| Library | Why |
|---------|-----|
| `expo`, `expo-router` | File-based routing; matches web-React habits |
| `@tanstack/react-query` | Server state, polling, retries |
| `react-hook-form` + `zod` | Forms sharing backend schemas |
| `expo-secure-store` | Token storage |
| `expo-notifications`, `expo-device` | Local reminders + push token |
| `expo-localization`, `i18next`, `react-i18next` | English/Malayalam |
| `@react-native-async-storage/async-storage` | Offline retry queue |
| `expo-location` | Best-effort SOS location |
| `react-native-nfc-manager` | NFC (Milestone 12) |
| `date-fns` | Formatting; use `Intl.DateTimeFormat` for other time zones |

### ML
`python >= 3.11`, `pandas`, `scikit-learn`, `joblib`, `fastapi`, `uvicorn`, `pydantic`. Optional: `matplotlib`, `shap`.

### Deliberately not used
Redis, Kafka/RabbitMQ, Socket.IO/WebSockets, GraphQL, Redux, TypeORM, Kubernetes, microservices, UI kits, chart libraries (adherence is drawn with simple Views), neural networks.

---

## 17. Architectural decisions and trade-offs

| ID | Decision | Alternative | Why this, and what it costs |
|----|----------|-------------|-----------------------------|
| AD-1 | One Expo app, role-based routes | Expo app for elderly + React web dashboard for caregivers | One codebase, one auth, and push works for caregivers abroad on their phones. Cost: the information-dense caregiver UI is cramped on a phone. Mitigation: web export for the review demo. If dev-build workflow hurts, the caregiver web dashboard is the fallback, using the same API. |
| AD-2 | Event log + state tables | Full event sourcing | Gives history and training data without the complexity of replay. Cost: two writes per change, handled by one transaction helper. |
| AD-3 | Scheduler loop over idempotent queries | `pg-boss`, cron per job, Redis queue | No job state to lose; restart-safe; nothing new to learn. Cost: one-minute granularity (fine). |
| AD-4 | Missed events materialized by scheduler | Compute "missed" on read | Makes absences first-class facts for rules, timeline and training. Cost: a scheduler must be running (see risk R4). |
| AD-5 | Pure `care-engine` library | Rules inside services | Testable, reusable by the simulator, easy to present. Cost: a workspace package boundary. |
| AD-6 | ML scoped to LOW/MEDIUM delivery timing | ML scoring all alerts or deciding emergencies | Defensible safety story; preserves the honest framing. Cost: smaller ML surface, but that surface is where alert fatigue actually lives. |
| AD-7 | Features computed in TypeScript | Features in Python | Prevents train/serve skew; single source of truth. |
| AD-8 | Python sidecar for inference | Export logistic regression coefficients and score in Node | Lets you swap RF/gradient boosting freely and demonstrates a real ML boundary. Cost: one more process. If logistic regression wins clearly, scoring in Node is a legitimate simplification. |
| AD-9 | Consolidated "care situation" alert | One alert per triggering event | Directly attacks alert fatigue deterministically, before any ML. |
| AD-10 | Polling + push, no sockets | WebSockets/SSE | Fewer moving parts, works through flaky networks. Cost: up to ~30 s dashboard latency when foregrounded (push covers urgent cases). |
| AD-11 | Local notifications for reminders | Server-pushed reminders | Survives no-network; no backend dependency for the most frequent notification. Cost: rescheduling logic on the client. |
| AD-12 | Pairing code for elderly onboarding | Elderly signs up with email/password | Realistic for the user group. Cost: pairing flow to build and secure. |
| AD-13 | Text + CHECK instead of PG enums | Native enums | Simpler migrations when event types evolve. |
| AD-14 | REST with an aggregated `/me/home` | Fine-grained calls or GraphQL | Elderly screen is simple and should make one call. |

---

## 18. Risks and pre-implementation checks

| # | Risk | Why it matters | Action |
|---|------|----------------|--------|
| R1 | **Expo Go cannot do Android remote push or NFC** | The original plan assumed Expo Go | Milestone 0 builds a dev build via EAS Build or locally with Android Studio (`expo run:android`). EAS free-tier builds can queue; a local build avoids that. Verify current Expo docs. |
| R2 | Synthetic-data circularity | Labels come from the same assumptions as the model; metrics can look unrealistically good | State it in the report, show the simulator's assumptions, use group splits, present shadow-mode/pilot data as a sanity check, avoid accuracy claims about real caregivers |
| R3 | Android battery optimisation | Reminders and pushes delayed on some phones | Test on the demo phone; ship the keep-alive instructions; in-app "due now" card as backup |
| R4 | Hosting that sleeps | Free tiers that idle the server stop the scheduler, so nothing gets marked missed | Demo from a laptop with Docker (plus tunnel), or host on something always-on; verify the host's current free-tier behaviour |
| R5 | Network setup for phone to backend | Android release builds block cleartext HTTP; LAN IPs change | Use an HTTPS tunnel (for example Cloudflare Tunnel or ngrok) or set the cleartext option in dev builds; put the API URL in `EXPO_PUBLIC_API_URL` |
| R6 | Time-based logic is hard to test and demo | Missed logic depends on waiting | `Clock` injection from M1, fake-clock endpoint, scripted scenarios in `tools/demo-scenarios.ts` |
| R7 | Time zones | Elderly in IST, caregiver elsewhere | Everything UTC; schedules in elderly local time; display both |
| R8 | Double-fire / lost events | Retried requests, flaky networks, restart mid-tick | `clientEventId` idempotency; unique constraints on doses and check-ins; idempotent scheduler queries |
| R9 | False confidence in safety | SOS depends on phone connectivity and push | Explicit disclaimer; clear "Not sent" state; call buttons; do not market it as an emergency system |
| R10 | Scope creep | Super-app drift | This document is the scope; additions require approval. Secondary caregivers, NDEF launching, location maps, SMS are all explicitly stretch or out |
| R11 | Malayalam text quality | Machine translation of medical-adjacent UI can be wrong or confusing | Have a Malayalam-speaking family member review every elderly-facing string |
| R12 | Team contract drift | Mobile and backend diverge | `packages/shared` zod schemas are the API contract; CI-style `tsc` across workspaces before merges |
| R13 | Privacy of real pilot data | Family members' health data | Consent, minimal data, separate pilot database, no real data in the repo |
| R14 | ML service down at demo | Extra process can fail | Baseline fallback is tested and demoable ("kill the ML service; alerts still flow") |

### Checklist before writing code

- [ ] D1-D12 approved or amended
- [ ] Android phone model noted; NFC present and working
- [ ] NFC tags ordered
- [ ] Decision on dev-build path (EAS vs local Android Studio)
- [ ] Malayalam reviewer identified
- [ ] Rule thresholds in Section 8.2 reviewed by the team (they are starting values, not clinical guidance)
- [ ] Agreement on the two early contracts: `packages/shared` API types and `CareContext`

---

## Appendix A: Instruction block for the coding agent

1. Implement **one milestone at a time** from Section 15. Stop at each exit criterion and report.
2. Keep business logic out of mobile components; the client renders server output.
3. Validate every request body and query with zod on the backend.
4. Authorization goes through `assertCanAccessElderly`; add a negative test with every new endpoint.
5. Every state change that matters writes an event in the same transaction as the state update.
6. Do not add a dependency that is not listed in Section 16 without proposing it first.
7. Rules live only in `packages/care-engine`. Thresholds only in `RuleConfig`. Bump `RULESET_VERSION` when either changes.
8. The SOS path must not import from `coordination/prioritizer` or call the ML service.
9. ML may only affect delivery timing for LOW/MEDIUM alerts, and only through the guardrails in Section 9.4.
10. Do not implement future milestones early. Do not invent requirements; raise ambiguities instead.
