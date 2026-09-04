# Tender Intelligence — Project Scaffold Design

Date: 2026-09-04
Status: Approved

## Context

Full product requirements live in
`/Users/pongpanot_s/Documents/Codex/2026-09-04/referenced-chatgpt-conversation-this-is-an/outputs/tender-intelligence-requirements.md`
(and its Thai translation, `-th.md`). This spec covers only the initial
project scaffold: repo structure, tooling, and one working end-to-end
ingestion slice — not the full MVP.

## Decisions

- **Backend language:** Python + FastAPI. The ingestion/AI pipeline
  (PDF/OCR extraction, language detection, embeddings, hybrid
  rules+LLM classification) leans heavily on Python's ecosystem
  (pdfplumber, spaCy/langdetect, sentence-transformers, BeautifulSoup,
  Celery). TypeScript would mean rebuilding or wrapping most of that
  tooling.
- **Repo layout:** Monorepo. `/apps/web` (Next.js), `/apps/api`
  (FastAPI), `/packages/schema` (shared canonical types, JSON Schema
  as source of truth for both TS and Python). Simpler to coordinate
  schema changes across frontend/backend than a polyrepo.
- **Local infra:** Full stack via Docker Compose — Postgres, Redis,
  OpenSearch, api, worker — so ingestion can be tested end-to-end from
  day one.
- **Scaffold depth:** Skeleton + one real working connector (not a
  bare skeleton, not the full MVP). Proves the architecture end to end
  while keeping scope bounded.
- **First source:** UK Find a Tender. It has a documented, free,
  no-auth-required OCDS-based JSON search API — simplest to integrate
  correctly and legally clear-cut for a first slice, vs. SAM.gov
  (needs an API key) or EU TED (more complex eForms/XML model).

## Repo Layout

```
tender-intel/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/           # Next.js frontend
├── packages/
│   └── schema/         # Shared canonical types (JSON Schema)
├── docker-compose.yml   # Postgres, Redis, OpenSearch, api, worker
├── docs/
│   └── superpowers/specs/
└── README.md
```

`pnpm` workspaces for JS tooling. Plain `uv`/`pip` for Python — no
Turborepo at this size (YAGNI).

## Backend (`apps/api`)

Maps to the ingestion architecture in requirements section 5.

```
apps/api/
├── app/
│   ├── connectors/         # Source Registry pattern; one module per source
│   │   ├── base.py          # Connector protocol (fetch, parse_page, etc.)
│   │   └── uk_find_a_tender.py
│   ├── raw_archive/         # raw fetch payload storage (local disk in dev)
│   ├── parsing/             # extract fields from raw payload
│   ├── normalization/       # canonical schema mapping, ISO normalization
│   ├── dedup/                # stub — no second source to dedupe against yet
│   ├── matching/             # stub — rules-engine skeleton, no LLM call yet
│   ├── alerts/                # stub
│   ├── api/                  # FastAPI routers: /tenders, /sources, /health
│   ├── db/                    # SQLAlchemy models + Alembic migrations
│   └── worker/                 # scheduler/job running the connector on a cron
├── tests/
└── pyproject.toml
```

Modules not exercised by the working slice (dedup, matching, alerts,
auth, billing) are real folders with a clear interface stub and a
`NotImplementedError`/TODO marker — not fake logic.

## Data Flow (working slice)

`UK Find a Tender connector` → fetch OCDS JSON (paginated) → store raw
response in `raw_documents` table (JSON column, dev-mode; object
storage later) → parser extracts title/buyer/description/deadline/
budget/CPV codes → normalizer maps into the canonical `tenders` table
(per requirements section 10.1) → `GET /api/tenders` returns the list
→ one Next.js page (`/tenders`) renders it in a table.

No AI matching, scoring, or alerting in this slice — those need a
company profile, which doesn't exist yet. This slice only proves
ingestion → canonical storage → API → UI end to end.

## Database

SQLAlchemy 2.0 + Alembic. First migration creates only what the slice
needs: `sources`, `source_fetch_runs`, `raw_documents`, `tenders`
(canonical fields from requirements section 10.1). Other tables from
requirements section 18 (organizations, users, company_profiles,
scores, watchlists, billing, etc.) are not created yet — they belong
to later phases (auth, matching) and creating empty tables now would
be speculative.

## Frontend

Next.js (App Router) + TypeScript + Tailwind. One page: tender list
table reading from the API. No auth, no company profile UI yet.

## Testing

pytest for connector/parser/normalizer (unit tests against a saved
sample OCDS response — no live API calls during tests), one
integration test for `GET /api/tenders`. Frontend: type-checking only
for now.

## Out of Scope (this scaffold)

- Deduplication logic (needs 2+ sources)
- AI matching / scoring / company profiles
- Alerting
- Auth, billing, multi-tenancy
- Any source beyond UK Find a Tender
- OpenSearch indexing (compose service is present, wiring is not)
