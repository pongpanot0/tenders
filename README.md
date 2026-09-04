# Tender Intelligence

AI-assisted procurement/tender discovery platform. See
`docs/superpowers/specs/2026-09-04-tender-intelligence-scaffold-v2-design.md`
for the scaffold design.

## Structure

- `apps/api` — NestJS API + BullMQ worker (ingestion, parsing, versioning, outbox, REST API)
- `packages/schema` — shared canonical tender schema (JSON Schema + TS types)

No frontend is scaffolded here — a separate mockup/frontend consumes
`GET /v1/tenders` (see its response shape in
`docs/superpowers/plans/2026-09-04-tender-intelligence-scaffold-v2.md`,
Task 13).

## Local development

### Prerequisites

Docker + Docker Compose, Node.js 20+, pnpm.

### Run everything with Docker Compose

```bash
docker compose up --build
```

- API: http://localhost:3001
- MinIO console: http://localhost:9001 (tender / tender12345)

Run migrations once against the running Postgres container:

```bash
docker compose exec api npx prisma migrate deploy
```

Seed one source config so ingestion has something to run:

```bash
docker compose exec postgres psql -U tender -d tender_intel -c \
  "insert into source_registry (id, name, country_code, access_method, policy_status, adapter_key) values ('uk_find_a_tender', 'UK Find a Tender', 'GB', 'api', 'approved', 'uk-find-a-tender-v1');"
docker compose exec postgres psql -U tender -d tender_intel -c \
  "insert into source_configs (id, source_id, environment, enabled) values (gen_random_uuid(), 'uk_find_a_tender', 'production', true);"
```

Trigger an ingestion run via the Nest CLI REPL, or add a small admin
endpoint in a later plan — this scaffold intentionally has no
scheduler/admin trigger yet (see the design doc's "Out of Scope").

### Run backend tests locally

```bash
docker compose up -d postgres redis minio
cd apps/api
pnpm install
pnpm test
```

## What's implemented

One working end-to-end slice, event-driven per the technical spec:
UK Find a Tender → object storage → raw_records → queued parse job →
normalize/version/dedup-by-notice → transactional outbox → relay →
`GET /v1/tenders`. No frontend, auth, matching, alerts, or billing —
see the design doc's "Out of Scope" section.
