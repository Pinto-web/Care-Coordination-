-- Minimal schema for shell (tables defined; migrations scaffolded)
-- (Generated structure mirrors schema.ts subset for Step 4)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('CAREGIVER','ELDERLY')),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elderly_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  date_of_birth DATE,
  checkin_window_start TEXT NOT NULL DEFAULT '07:00',
  checkin_window_end TEXT NOT NULL DEFAULT '11:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS care_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES users(id),
  elderly_id UUID NOT NULL REFERENCES users(id),
  is_primary BOOLEAN DEFAULT FALSE,
  relationship_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  strength TEXT,
  form TEXT,
  instructions TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id),
  local_time TEXT NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  dose_text TEXT NOT NULL,
  grace_minutes INTEGER NOT NULL DEFAULT 30,
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS scheduled_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES medication_schedules(id),
  medication_id UUID NOT NULL,
  elderly_id UUID NOT NULL REFERENCES users(id),
  due_at TIMESTAMPTZ NOT NULL,
  grace_deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','TAKEN','MISSED')),
  resolved_at TIMESTAMPTZ,
  resolved_via TEXT CHECK (resolved_via IN ('UI','NFC','SYSTEM')),
  was_late BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_doses_schedule_id_due_at_unique ON scheduled_doses (schedule_id, due_at);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('MEDICATION_TAKEN','MEDICATION_MISSED','ALERT_CREATED','ALERT_ESCALATED','ALERT_ACKNOWLEDGED','ALERT_RESOLVED','ALERT_AUTO_RESOLVED')),
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('UI','NFC','SYSTEM','CAREGIVER')),
  actor_user_id UUID REFERENCES users(id),
  ref_type TEXT,
  ref_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  client_event_id UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS events_elderly_id_client_event_id_unique ON events (elderly_id, client_event_id);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id UUID NOT NULL REFERENCES users(id),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_event_id UUID REFERENCES events(id),
  level TEXT NOT NULL CHECK (level IN ('NORMAL','LOW','MEDIUM','HIGH','EMERGENCY')),
  hits JSONB NOT NULL DEFAULT '[]',
  ruleset_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_id UUID NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('CONCERN','SOS')),
  level TEXT NOT NULL CHECK (level IN ('NORMAL','LOW','MEDIUM','HIGH','EMERGENCY')),
  peak_level TEXT NOT NULL CHECK (peak_level IN ('NORMAL','LOW','MEDIUM','HIGH','EMERGENCY')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED','AUTO_RESOLVED')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]',
  dedupe_key TEXT,
  assessment_id UUID REFERENCES risk_assessments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution TEXT CHECK (resolution IN ('ACTION_TAKEN','CHECKED_OK','FALSE_ALARM','OTHER')),
  feedback TEXT CHECK (feedback IN ('USEFUL','NOT_NEEDED')),
  note TEXT
);
