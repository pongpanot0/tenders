# Tender Intelligence — Project Scaffold Design (v2)

Date: 2026-09-04
Status: Approved
Supersedes: `2026-09-04-tender-intelligence-scaffold-design.md`

## Context

The full technical blueprint lives at
`/Users/pongpanot_s/Documents/Codex/2026-09-04/referenced-chatgpt-conversation-this-is-an/outputs/tender-intelligence-technical-spec-th.md`
("the spec" below), used together with the product requirements doc
(`tender-intelligence-requirements.md`). The spec is more detailed and
architecturally opinionated than the requirements doc alone, and
supersedes the earlier v1 scaffold design (Python/FastAPI) on stack and
architecture. This document covers only the initial project scaffold —
repo structure, tooling, and one working end-to-end ingestion slice
built against the spec's architecture — not the spec's full Phase 0/1.

## Decisions

- **API framework:** NestJS (over Fastify). Matches the spec's §2
  service boundaries (API Gateway, Source Registry, Ingestion
  Orchestrator, etc.) well as module boundaries in the "modular
  monolith" the spec recommends for MVP (§2: "MVP อาจ deploy เป็น
  modular monolith ... แต่ boundaries เหล่านี้ต้องแยกเป็น
  modules/packages").
- **Scaffold scope:** Spec §23's "Phase 0: Foundations" plus one real
  adapter slice, not foundations alone and not all of Phase 1. Building
  the DB schema, outbox, and queue with no data flowing through them
  wouldn't prove the architecture works; building the full Phase 1
  (3 adapters, matching, alerts, billing) in one scaffold is not
  bounded work.
- **ORM:** Prisma. Standard NestJS/Postgres pairing, readable
  `schema.prisma` doubles as schema documentation, strong migration
  tooling.
- **Object storage (local dev):** MinIO via Docker Compose, not a local
  disk stub. Spec §7 step 4 requires raw payloads go to object storage
  before any DB write, and §18 requires signed URLs off a private
  bucket — a disk stub wouldn't exercise the actual S3 client/signed-URL
  code path this architecture depends on.
- **First source:** UK Find a Tender (per v1's rationale — free,
  no-auth, documented OCDS JSON API). Spec §8's priority source
  playbook lists it as an early, low-friction target.

## Repo Layout

```
tender-intel/
├── apps/
│   ├── api/          # NestJS API + BullMQ workers (one codebase, per spec §2)
│   └── web/           # Next.js frontend
├── packages/
│   └── schema/         # shared canonical tender contract (JSON Schema + TS types)
├── docker-compose.yml   # Postgres, Redis, MinIO, api, worker, web
├── docs/
│   └── superpowers/{specs,plans}/
└── README.md
```

## Database (spec §6, minimum subset for this slice)

Tables: `source_registry`, `source_configs`, `source_runs`,
`raw_records`, `tenders`, `tender_versions`, `tender_notices`,
`outbox_events` — columns, constraints, and indexes exactly as spec §6
defines (content-hash versioning, `source_id + source_external_id`
uniqueness on `tender_notices`, `source_run_id + external_id +
payload_hash` uniqueness on `raw_records`, etc.).

Explicitly not created yet: `organizations`, `users`, `memberships`,
`company_profiles`, `matches`, `match_feedback`, `saved_tenders`,
`alerts`, `notification_preferences`, `api_keys`, `audit_logs`,
`webhook_events`. Nothing in this slice reads or writes them, and per
spec §6's own principle, tenant-scoped tables need an `organization_id`
— but there's no tenant concept yet for them to scope.

## Ingestion Architecture (spec §7)

`SourceAdapter` interface implemented exactly as spec §7 defines
(`discover`, `healthCheck`; `fetch`/`normalizeHint` unused by this
adapter). `UkFindATenderAdapter` implements it against the OCDS JSON
API.

Flow: orchestrator creates a `source_run` (`QUEUED` → `RUNNING`) →
adapter `discover()`s records → each raw payload is written to MinIO
first, then a `raw_records` row is inserted transactionally with a
checksum → a BullMQ job is queued to parse that raw record (this is the
key architectural difference from v1: raw storage and parsing are
decoupled through a real queue hop, not an inline function call, per
spec §7 step 5 and §12's event-driven design) → the parser normalizes
fields, computes `content_hash`, resolves identity via `tender_notices`
(`source_id + source_external_id`), and writes a new `tender_version`
only on material change (spec §9's "Material change decision") → an
`outbox_events` row is written in the same DB transaction (spec §12's
transactional outbox pattern).

No consumer exists yet for `tender.version.published` events (no
classifier, indexer, or matcher is built), so this scaffold includes a
minimal outbox relay that polls `outbox_events`, logs each one, and
marks it published — enough to prove the outbox mechanism actually
works end to end, without building the real consumers spec §12 lists.

Dedup in this slice is limited to spec §9's dedup algorithm step 1
(exact key: `source_id + source_external_id`). Steps 2-6 (candidate
retrieval, similarity scoring, review queue, `tender_relationships`)
need a second source to have anything to deduplicate against, so
they're out of scope here, same as v1.

## API (spec §13)

`GET /v1/tenders` — cursor-paginated, response shaped as
`{ data, page: { nextCursor, hasMore }, meta: { requestId } }` per spec
§13/§25. The cursor is a plain base64 encoding of the last tender ID,
**not** HMAC-signed as spec §13 specifies ("cursor encodes sort key and
last ID, signed/opaque to client") — documented simplification, since
this is an unauthenticated read-only endpoint with no auth system yet
to make signing meaningful. Error envelope matches spec §13's shape and
stable error codes.

No other endpoints from spec §13's table (organizations, profiles,
matches, billing, admin) — they all depend on auth/tenancy, which
doesn't exist in this slice.

## Frontend

Same one page as v1 (`/tenders` listing table), updated to unwrap the
`{ data, page, meta }` response envelope instead of a bare array.

## Testing (spec §21, scoped to what this slice touches)

- **Unit:** normalizer field mapping, material-change detection, cursor
  encode/decode.
- **Contract:** `UkFindATenderAdapter` against saved OCDS fixtures
  (normal, paginated, and a duplicate-of-existing-notice case).
- **Integration:** DB transaction + outbox + BullMQ flow, run against
  the Docker Compose Postgres/Redis/MinIO (not an in-memory substitute
  — Prisma/Postgres-specific behavior and real BullMQ/Redis are exactly
  what's being proven here). Documented in the README as requiring
  `docker compose up -d postgres redis minio` before running.

No E2E tests yet (spec §21's E2E scenario requires onboarding → profile
→ match, none of which exist).

## Out of Scope (this scaffold)

- Auth, RBAC, organizations, multi-tenancy (spec §14)
- Company profiles, matching, AI intelligence pipeline (spec §10-11)
- Notifications/alerts (spec §17)
- Search indexing beyond a plain Postgres query (spec §16)
- Admin console / review queues (spec §8, §19's runbooks)
- Billing/Stripe (spec §14)
- Any source beyond UK Find a Tender
- Signed/HMAC cursors, rate limiting, `Idempotency-Key` header handling
- Document pipeline (download, malware scan, OCR) — spec §7's document
  handling; UK Find a Tender fixtures used here carry no attachments
