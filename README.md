# Care Coordination Platform

Project review milestone: Medication Management + Caregiver Alerting (vertical slice).

This repository follows the architecture defined in `ARCHITECTURE.md`.

## Development

Prerequisites:
- Node 18+ / 20+
- Docker (for Postgres in development)

## Setup

1. Install dependencies
```bash
npm install
```

2. Start infrastructure
```bash
docker compose up -d postgres
```

3. Copy environment
```bash
cp .env.example .env
```

4. Typecheck/build
```bash
npm run typecheck
npm run build
```

## Scope (current milestone)
Medication configuration → scheduled dose → TAKEN → missed detection → MISSED → care engine → alert → acknowledge/resolve. Dev-only clock/tick for deterministic demos.

See ARCHITECTURE.md for full design.
