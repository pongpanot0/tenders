# Tender Intelligence Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Tender Intelligence monorepo with a real, working
end-to-end ingestion slice: fetch tenders from the UK Find a Tender OCDS
API, parse and normalize them into the canonical schema, store them in
Postgres, and list them through a FastAPI endpoint and a Next.js page.

**Architecture:** Monorepo with `apps/api` (FastAPI + SQLAlchemy),
`apps/web` (Next.js), and `packages/schema` (shared canonical tender
contract). The backend ingestion pipeline follows the Source Registry
pattern from the requirements doc: connector → raw archive → parser →
normalizer → DB, with dedup/matching/alerts wired in as explicit,
non-crashing stubs since their prerequisites (a second source, a company
profile, watchlists) don't exist yet.

**Tech Stack:** Python 3.11+/FastAPI/SQLAlchemy 2.0/Alembic/pytest/respx
(backend); Node 20+/pnpm/Next.js (App Router)/TypeScript/Tailwind/Vitest
(frontend); Postgres/Redis/OpenSearch via Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-04-tender-intelligence-scaffold-design.md`

## Global Constraints

- Backend language: Python + FastAPI (not Node/TypeScript).
- Repo layout: monorepo — `apps/web`, `apps/api`, `packages/schema`.
- Local infra: full Docker Compose stack — Postgres, Redis, OpenSearch, api, worker.
- Scaffold depth: skeleton + one real working connector, not the full MVP.
- First source: UK Find a Tender only (OCDS JSON API, no auth required).
- Out of scope for this plan: deduplication logic, AI matching/scoring, company profiles, alerting, auth, billing, multi-tenancy, any source beyond UK Find a Tender, OpenSearch indexing wiring.
- JS tooling: pnpm workspaces, no Turborepo.
- DB: SQLAlchemy 2.0 + Alembic; first migration creates only `sources`, `source_fetch_runs`, `raw_documents`, `tenders`.
- Backend tests: pytest, HTTP mocked via respx, DB tests use in-memory SQLite (Postgres is used at runtime via Docker Compose, not in tests).
- Frontend tests: Vitest + Testing Library for components; type-checking via `tsc --noEmit`.

---

### Task 1: Root repo scaffolding & tooling

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `docker-compose.yml`
- Create: `.env.example`

**Interfaces:**
- Produces: `docker-compose.yml` with `postgres`, `redis`, `opensearch` services (extended with `api`/`worker`/`web` in Task 13). `pnpm-workspace.yaml` covering `apps/*` and `packages/*`.

- [ ] **Step 1: Create `.gitignore`**

```gitignore
# Node
node_modules/
.next/
dist/

# Python
__pycache__/
*.pyc
.venv/
*.egg-info/

# Env
.env

# Data
raw_archive_data/
dev.db

# OS
.DS_Store
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "tender-intel",
  "private": true,
  "version": "0.0.0"
}
```

- [ ] **Step 4: Create `.env.example`**

```
DATABASE_URL=postgresql+psycopg://tender:tender@localhost:5432/tender_intel
RAW_ARCHIVE_DIR=./raw_archive_data
API_BASE_URL=http://localhost:8000
```

- [ ] **Step 5: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tender
      POSTGRES_PASSWORD: tender
      POSTGRES_DB: tender_intel
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  opensearch:
    image: opensearchproject/opensearch:2.15.0
    environment:
      - discovery.type=single-node
      - plugins.security.disabled=true
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

volumes:
  postgres_data:
```

- [ ] **Step 6: Create placeholder `README.md`**

```markdown
# Tender Intelligence

Scaffold in progress. See `docs/superpowers/specs/2026-09-04-tender-intelligence-scaffold-design.md`.
```

(This gets replaced with full run instructions in Task 13.)

- [ ] **Step 7: Verify**

Run: `docker compose config`
Expected: prints the resolved compose config with no errors (exit code 0).

- [ ] **Step 8: Commit**

```bash
git add .gitignore README.md pnpm-workspace.yaml package.json docker-compose.yml .env.example
git commit -m "chore: scaffold repo root (workspace config, docker-compose, gitignore)"
```

---

### Task 2: Shared canonical schema package

**Files:**
- Create: `packages/schema/package.json`
- Create: `packages/schema/tsconfig.json`
- Create: `packages/schema/vitest.config.ts`
- Create: `packages/schema/tender.schema.json`
- Create: `packages/schema/src/index.ts`
- Create: `packages/schema/src/tender.test.ts`

**Interfaces:**
- Produces: `CanonicalTender`, `TenderCategory`, `TenderAttachment` TS interfaces and `tenderSchema` JSON export from `@tender-intel/schema` (`packages/schema/src/index.ts`).

- [ ] **Step 1: Write the failing test**

Create `packages/schema/src/tender.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "../tender.schema.json";
import type { CanonicalTender } from "./index";

describe("tender schema", () => {
  it("accepts a valid canonical tender", () => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const sample: CanonicalTender = {
      tender_id: "ten_1",
      source_id: "uk_find_a_tender",
      source_notice_id: "notice-123",
      title: "Example tender",
      buyer_name: "Example Council",
      country: "GB",
      publication_date: "2026-09-01T00:00:00Z",
      categories: [{ scheme: "CPV", code: "72000000" }],
      attachments: [],
    };

    const valid = validate(sample);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

  it("rejects a tender missing required fields", () => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const invalid = { tender_id: "ten_1" };
    expect(validate(invalid)).toBe(false);
  });
});
```

- [ ] **Step 2: Create the package files needed to run it**

Create `packages/schema/package.json`:

```json
{
  "name": "@tender-intel/schema",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

Create `packages/schema/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Create `packages/schema/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm install && pnpm --filter @tender-intel/schema test`
Expected: FAIL — `tender.schema.json` and `./index` don't exist yet.

- [ ] **Step 4: Write the canonical schema**

Create `packages/schema/tender.schema.json`:

```json
{
  "$id": "https://tender-intel/schema/tender.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalTender",
  "type": "object",
  "required": [
    "tender_id",
    "source_id",
    "source_notice_id",
    "title",
    "buyer_name",
    "country",
    "publication_date",
    "categories"
  ],
  "properties": {
    "tender_id": { "type": "string" },
    "source_id": { "type": "string" },
    "source_notice_id": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": ["string", "null"] },
    "buyer_name": { "type": "string" },
    "country": { "type": "string", "minLength": 2, "maxLength": 2 },
    "region": { "type": ["string", "null"] },
    "procurement_method": { "type": ["string", "null"] },
    "publication_date": { "type": "string", "format": "date-time" },
    "deadline": { "type": ["string", "null"], "format": "date-time" },
    "budget_amount_min": { "type": ["number", "null"] },
    "budget_amount_max": { "type": ["number", "null"] },
    "currency": { "type": ["string", "null"], "minLength": 3, "maxLength": 3 },
    "categories": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["scheme", "code"],
        "properties": {
          "scheme": { "type": "string" },
          "code": { "type": "string" }
        }
      }
    },
    "language": { "type": ["string", "null"] },
    "submission_method": { "type": ["string", "null"] },
    "attachments": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "url"],
        "properties": {
          "name": { "type": "string" },
          "url": { "type": "string" }
        }
      }
    },
    "source_url": { "type": ["string", "null"] },
    "canonical_url": { "type": ["string", "null"] }
  },
  "additionalProperties": false
}
```

Create `packages/schema/src/index.ts`:

```ts
export interface TenderCategory {
  scheme: string;
  code: string;
}

export interface TenderAttachment {
  name: string;
  url: string;
}

export interface CanonicalTender {
  tender_id: string;
  source_id: string;
  source_notice_id: string;
  title: string;
  description?: string | null;
  buyer_name: string;
  country: string;
  region?: string | null;
  procurement_method?: string | null;
  publication_date: string;
  deadline?: string | null;
  budget_amount_min?: number | null;
  budget_amount_max?: number | null;
  currency?: string | null;
  categories: TenderCategory[];
  language?: string | null;
  submission_method?: string | null;
  attachments: TenderAttachment[];
  source_url?: string | null;
  canonical_url?: string | null;
}

export { default as tenderSchema } from "../tender.schema.json";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @tender-intel/schema test`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/schema
git commit -m "feat(schema): add canonical tender JSON schema and TS types"
```

---

### Task 3: Backend project skeleton (FastAPI + health endpoint)

**Files:**
- Create: `apps/api/pyproject.toml`
- Create: `apps/api/app/__init__.py`
- Create: `apps/api/app/config.py`
- Create: `apps/api/app/main.py`
- Create: `apps/api/app/api/__init__.py`
- Create: `apps/api/app/api/routers/__init__.py`
- Create: `apps/api/app/api/routers/health.py`
- Create: `apps/api/tests/__init__.py`
- Create: `apps/api/tests/test_health.py`

**Interfaces:**
- Produces: `settings` (`app.config.settings`, a `pydantic_settings.BaseSettings` instance with `database_url: str`, `raw_archive_dir: str`); `app` (`app.main.app`, a `FastAPI` instance).

- [ ] **Step 1: Create `apps/api/pyproject.toml`**

```toml
[project]
name = "tender-intel-api"
version = "0.0.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "pydantic-settings>=2.5.0",
  "sqlalchemy>=2.0.35",
  "alembic>=1.13.0",
  "psycopg[binary]>=3.2.0",
  "httpx>=0.27.0",
]

[project.optional-dependencies]
dev = [
  "pytest>=8.3.0",
  "respx>=0.21.1",
]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
include = ["app*"]
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/tests/__init__.py` (empty) and `apps/api/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: Set up the environment and run test to verify it fails**

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest tests/test_health.py -v
```

Expected: FAIL — `app.main` doesn't exist.

- [ ] **Step 4: Implement `app/config.py`**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./dev.db"
    raw_archive_dir: str = "./raw_archive_data"


settings = Settings()
```

- [ ] **Step 5: Implement `app/api/routers/health.py`**

Create `apps/api/app/api/__init__.py` and `apps/api/app/api/routers/__init__.py` (both empty), then:

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def get_health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 6: Implement `app/main.py`**

Create `apps/api/app/__init__.py` (empty), then:

```python
from fastapi import FastAPI

from app.api.routers import health

app = FastAPI(title="Tender Intelligence API")

app.include_router(health.router)
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pytest tests/test_health.py -v`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/api
git commit -m "feat(api): scaffold FastAPI app with health endpoint"
```

---

### Task 4: Database models and migrations

**Files:**
- Create: `apps/api/app/db/__init__.py`
- Create: `apps/api/app/db/base.py`
- Create: `apps/api/app/db/models.py`
- Create: `apps/api/tests/test_db_models.py`
- Create: `apps/api/alembic.ini`
- Create: `apps/api/migrations/env.py`
- Create: `apps/api/migrations/script.py.mako`
- Create: `apps/api/migrations/versions/0001_initial.py`

**Interfaces:**
- Consumes: `settings.database_url` from Task 3 (`app.config`).
- Produces: `Base` (declarative base, `app.db.base.Base`), `engine`, `SessionLocal` (`app.db.base`); ORM models `Source`, `SourceFetchRun`, `RawDocument`, `Tender` (`app.db.models`) with the fields listed below.

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_db_models.py`:

```python
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.models import Source, Tender


@pytest.fixture()
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_insert_and_query_tender(session):
    source = Source(
        source_id="uk_find_a_tender",
        name="UK Find a Tender",
        country="GB",
        access_type="api",
        base_url="https://www.find-tender.service.gov.uk",
    )
    session.add(source)

    tender = Tender(
        tender_id="ten_1",
        source_id="uk_find_a_tender",
        source_notice_id="notice-123",
        title="Example tender",
        buyer_name="Example Council",
        country="GB",
        publication_date=datetime(2026, 9, 1, tzinfo=timezone.utc),
        categories=[{"scheme": "CPV", "code": "72000000"}],
        attachments=[],
    )
    session.add(tender)
    session.commit()

    fetched = session.get(Tender, "ten_1")
    assert fetched is not None
    assert fetched.title == "Example tender"
    assert fetched.categories == [{"scheme": "CPV", "code": "72000000"}]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_db_models.py -v`
Expected: FAIL — `app.db.base` / `app.db.models` don't exist.

- [ ] **Step 3: Implement `app/db/base.py`**

Create `apps/api/app/db/__init__.py` (empty), then:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
```

- [ ] **Step 4: Implement `app/db/models.py`**

```python
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Source(Base):
    __tablename__ = "sources"

    source_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)
    access_type: Mapped[str] = mapped_column(String, nullable=False)
    base_url: Mapped[str] = mapped_column(String, nullable=False)
    enabled: Mapped[bool] = mapped_column(default=True)

    fetch_runs: Mapped[list["SourceFetchRun"]] = relationship(back_populates="source")


class SourceFetchRun(Base):
    __tablename__ = "source_fetch_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.source_id"))
    started_at: Mapped[datetime] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    records_fetched: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String, default="running")

    source: Mapped["Source"] = relationship(back_populates="fetch_runs")


class RawDocument(Base):
    __tablename__ = "raw_documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.source_id"))
    source_notice_id: Mapped[str] = mapped_column(String, index=True)
    storage_path: Mapped[str] = mapped_column(String)
    fetched_at: Mapped[datetime] = mapped_column(DateTime)


class Tender(Base):
    __tablename__ = "tenders"

    tender_id: Mapped[str] = mapped_column(String, primary_key=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.source_id"))
    source_notice_id: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    buyer_name: Mapped[str] = mapped_column(String)
    country: Mapped[str] = mapped_column(String)
    region: Mapped[str | None] = mapped_column(String, nullable=True)
    procurement_method: Mapped[str | None] = mapped_column(String, nullable=True)
    publication_date: Mapped[datetime] = mapped_column(DateTime)
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    budget_amount_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    budget_amount_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str | None] = mapped_column(String, nullable=True)
    categories: Mapped[list] = mapped_column(JSON, default=list)
    language: Mapped[str | None] = mapped_column(String, nullable=True)
    submission_method: Mapped[str | None] = mapped_column(String, nullable=True)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    source_url: Mapped[str | None] = mapped_column(String, nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(String, nullable=True)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_db_models.py -v`
Expected: PASS.

- [ ] **Step 6: Set up Alembic**

Create `apps/api/alembic.ini`:

```ini
[alembic]
script_location = migrations
sqlalchemy.url =

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

Create `apps/api/migrations/env.py`:

```python
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import settings
from app.db.base import Base
from app.db import models  # noqa: F401  ensures models are registered on Base.metadata

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

Create `apps/api/migrations/script.py.mako`:

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

Create `apps/api/migrations/versions/0001_initial.py`:

```python
"""initial tables

Revision ID: 0001
Revises:
Create Date: 2026-09-04

"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sources",
        sa.Column("source_id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("country", sa.String(), nullable=False),
        sa.Column("access_type", sa.String(), nullable=False),
        sa.Column("base_url", sa.String(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "source_fetch_runs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source_id", sa.String(), sa.ForeignKey("sources.source_id")),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("records_fetched", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(), nullable=False, server_default="running"),
    )

    op.create_table(
        "raw_documents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source_id", sa.String(), sa.ForeignKey("sources.source_id")),
        sa.Column("source_notice_id", sa.String(), nullable=False),
        sa.Column("storage_path", sa.String(), nullable=False),
        sa.Column("fetched_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_raw_documents_source_notice_id", "raw_documents", ["source_notice_id"])

    op.create_table(
        "tenders",
        sa.Column("tender_id", sa.String(), primary_key=True),
        sa.Column("source_id", sa.String(), sa.ForeignKey("sources.source_id")),
        sa.Column("source_notice_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("buyer_name", sa.String(), nullable=False),
        sa.Column("country", sa.String(), nullable=False),
        sa.Column("region", sa.String(), nullable=True),
        sa.Column("procurement_method", sa.String(), nullable=True),
        sa.Column("publication_date", sa.DateTime(), nullable=False),
        sa.Column("deadline", sa.DateTime(), nullable=True),
        sa.Column("budget_amount_min", sa.Float(), nullable=True),
        sa.Column("budget_amount_max", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(), nullable=True),
        sa.Column("categories", sa.JSON(), nullable=False),
        sa.Column("language", sa.String(), nullable=True),
        sa.Column("submission_method", sa.String(), nullable=True),
        sa.Column("attachments", sa.JSON(), nullable=False),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("canonical_url", sa.String(), nullable=True),
    )
    op.create_index("ix_tenders_source_notice_id", "tenders", ["source_notice_id"])


def downgrade() -> None:
    op.drop_table("tenders")
    op.drop_table("raw_documents")
    op.drop_table("source_fetch_runs")
    op.drop_table("sources")
```

- [ ] **Step 7: Verify the migration runs**

```bash
cd apps/api
DATABASE_URL="sqlite:///./migration_check.db" alembic upgrade head
python -c "import sqlite3; c = sqlite3.connect('migration_check.db'); print(sorted(r[0] for r in c.execute(\"select name from sqlite_master where type='table'\")))"
rm migration_check.db
```

Expected: prints a list including `sources`, `source_fetch_runs`, `raw_documents`, `tenders` (SQLite is used only for this local check; the Docker Compose environment runs the same migration against Postgres).

- [ ] **Step 8: Commit**

```bash
git add apps/api
git commit -m "feat(api): add DB models and initial Alembic migration"
```

---

### Task 5: Raw archive storage module

**Files:**
- Create: `apps/api/app/raw_archive/__init__.py`
- Create: `apps/api/app/raw_archive/storage.py`
- Create: `apps/api/tests/test_raw_archive.py`

**Interfaces:**
- Produces: `RawArchive` class (`app.raw_archive.storage.RawArchive`) with `__init__(self, base_dir: str)`, `save(self, source_id: str, notice_id: str, content: bytes) -> str`, `load(self, path: str) -> bytes`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_raw_archive.py`:

```python
from app.raw_archive.storage import RawArchive


def test_save_and_load_round_trip(tmp_path):
    archive = RawArchive(base_dir=str(tmp_path))

    path = archive.save("uk_find_a_tender", "notice-123", b'{"ocid": "abc"}')

    assert archive.load(path) == b'{"ocid": "abc"}'


def test_save_creates_unique_path_per_source(tmp_path):
    archive = RawArchive(base_dir=str(tmp_path))

    path_a = archive.save("source_a", "notice-1", b"a")
    path_b = archive.save("source_b", "notice-1", b"b")

    assert path_a != path_b
    assert archive.load(path_a) == b"a"
    assert archive.load(path_b) == b"b"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_raw_archive.py -v`
Expected: FAIL — `app.raw_archive.storage` doesn't exist.

- [ ] **Step 3: Implement `app/raw_archive/storage.py`**

Create `apps/api/app/raw_archive/__init__.py` (empty), then:

```python
from pathlib import Path


class RawArchive:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)

    def save(self, source_id: str, notice_id: str, content: bytes) -> str:
        source_dir = self.base_dir / source_id
        source_dir.mkdir(parents=True, exist_ok=True)
        safe_notice_id = notice_id.replace("/", "_")
        path = source_dir / f"{safe_notice_id}.json"
        path.write_bytes(content)
        return str(path)

    def load(self, path: str) -> bytes:
        return Path(path).read_bytes()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_raw_archive.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/raw_archive apps/api/tests/test_raw_archive.py
git commit -m "feat(api): add local-disk raw archive storage"
```

---

### Task 6: UK Find a Tender connector

**Files:**
- Create: `apps/api/app/connectors/__init__.py`
- Create: `apps/api/app/connectors/base.py`
- Create: `apps/api/app/connectors/uk_find_a_tender.py`
- Create: `apps/api/tests/fixtures/uk_ftts_page1.json`
- Create: `apps/api/tests/fixtures/uk_ftts_page2.json`
- Create: `apps/api/tests/test_connectors/__init__.py`
- Create: `apps/api/tests/test_connectors/test_uk_find_a_tender.py`

**Interfaces:**
- Produces: `Connector` protocol (`app.connectors.base.Connector`); `UkFindATenderConnector` (`app.connectors.uk_find_a_tender`) with `source_id = "uk_find_a_tender"`, `BASE_URL` constant, `__init__(self, base_url: str = BASE_URL, client: httpx.Client | None = None)`, `fetch_all(self) -> Iterator[dict]` yielding raw OCDS `release` dicts.

- [ ] **Step 1: Create fixture files**

Create `apps/api/tests/fixtures/uk_ftts_page1.json`:

```json
{
  "releases": [
    {
      "ocid": "ocds-abc-0001",
      "id": "ocds-abc-0001-tender",
      "date": "2026-09-01T00:00:00Z",
      "tender": {
        "id": "notice-1",
        "title": "Case management software",
        "description": "Supply of a case management platform.",
        "value": { "amount": 100000, "currency": "GBP" },
        "tenderPeriod": { "endDate": "2026-09-30T23:59:59Z" },
        "items": [{ "classification": { "scheme": "CPV", "id": "72000000" } }]
      },
      "buyer": { "name": "Example Council" },
      "parties": [
        {
          "id": "buyer-1",
          "roles": ["buyer"],
          "name": "Example Council",
          "address": { "countryName": "United Kingdom" }
        }
      ]
    }
  ],
  "links": {
    "next": "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages?cursor=page2"
  }
}
```

Create `apps/api/tests/fixtures/uk_ftts_page2.json`:

```json
{
  "releases": [
    {
      "ocid": "ocds-abc-0002",
      "id": "ocds-abc-0002-tender",
      "date": "2026-09-02T00:00:00Z",
      "tender": {
        "id": "notice-2",
        "title": "Cloud migration services",
        "description": "Migrate legacy systems to the cloud.",
        "value": { "amount": 250000, "currency": "GBP" },
        "tenderPeriod": { "endDate": "2026-10-15T23:59:59Z" },
        "items": [{ "classification": { "scheme": "CPV", "id": "72212000" } }]
      },
      "buyer": { "name": "Another Council" },
      "parties": [
        {
          "id": "buyer-1",
          "roles": ["buyer"],
          "name": "Another Council",
          "address": { "countryName": "United Kingdom" }
        }
      ]
    }
  ],
  "links": {}
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/tests/test_connectors/__init__.py` (empty) and `apps/api/tests/test_connectors/test_uk_find_a_tender.py`:

```python
import json
from pathlib import Path

import httpx
import respx

from app.connectors.uk_find_a_tender import UkFindATenderConnector

FIXTURES = Path(__file__).parent.parent / "fixtures"


@respx.mock
def test_fetch_all_follows_pagination():
    page1 = json.loads((FIXTURES / "uk_ftts_page1.json").read_text())
    page2 = json.loads((FIXTURES / "uk_ftts_page2.json").read_text())

    base_url = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages"
    respx.get(base_url).mock(return_value=httpx.Response(200, json=page1))
    respx.get(f"{base_url}?cursor=page2").mock(return_value=httpx.Response(200, json=page2))

    connector = UkFindATenderConnector(base_url=base_url)
    releases = list(connector.fetch_all())

    assert len(releases) == 2
    assert releases[0]["tender"]["id"] == "notice-1"
    assert releases[1]["tender"]["id"] == "notice-2"
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_connectors/test_uk_find_a_tender.py -v`
Expected: FAIL — `app.connectors.uk_find_a_tender` doesn't exist.

- [ ] **Step 4: Implement the connector**

Create `apps/api/app/connectors/__init__.py` (empty).

Create `apps/api/app/connectors/base.py`:

```python
from typing import Iterator, Protocol


class Connector(Protocol):
    source_id: str

    def fetch_all(self) -> Iterator[dict]:
        """Yield raw release/notice payloads one at a time."""
        ...
```

Create `apps/api/app/connectors/uk_find_a_tender.py`:

```python
from typing import Iterator

import httpx

SOURCE_ID = "uk_find_a_tender"
BASE_URL = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages"


class UkFindATenderConnector:
    source_id = SOURCE_ID

    def __init__(self, base_url: str = BASE_URL, client: httpx.Client | None = None):
        self.base_url = base_url
        self._client = client or httpx.Client()

    def fetch_all(self) -> Iterator[dict]:
        url = self.base_url
        while url:
            response = self._client.get(url)
            response.raise_for_status()
            payload = response.json()

            for release in payload.get("releases", []):
                yield release

            url = payload.get("links", {}).get("next")
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_connectors/test_uk_find_a_tender.py -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/connectors apps/api/tests/fixtures apps/api/tests/test_connectors
git commit -m "feat(api): add UK Find a Tender connector with pagination"
```

---

### Task 7: Parser

**Files:**
- Create: `apps/api/app/parsing/__init__.py`
- Create: `apps/api/app/parsing/uk_find_a_tender_parser.py`
- Create: `apps/api/tests/test_parsing/__init__.py`
- Create: `apps/api/tests/test_parsing/test_uk_find_a_tender_parser.py`

**Interfaces:**
- Consumes: fixture `apps/api/tests/fixtures/uk_ftts_page1.json` from Task 6.
- Produces: `parse(release: dict) -> dict` (`app.parsing.uk_find_a_tender_parser`) returning keys: `source_notice_id`, `title`, `description`, `buyer_name`, `country_name`, `publication_date_raw`, `deadline_raw`, `budget_amount`, `currency_raw`, `categories` (`list[{"scheme": str, "code": str}]`).

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_parsing/__init__.py` (empty) and `apps/api/tests/test_parsing/test_uk_find_a_tender_parser.py`:

```python
import json
from pathlib import Path

from app.parsing.uk_find_a_tender_parser import parse

FIXTURES = Path(__file__).parent.parent / "fixtures"


def test_parse_extracts_expected_fields():
    release = json.loads((FIXTURES / "uk_ftts_page1.json").read_text())["releases"][0]

    parsed = parse(release)

    assert parsed == {
        "source_notice_id": "notice-1",
        "title": "Case management software",
        "description": "Supply of a case management platform.",
        "buyer_name": "Example Council",
        "country_name": "United Kingdom",
        "publication_date_raw": "2026-09-01T00:00:00Z",
        "deadline_raw": "2026-09-30T23:59:59Z",
        "budget_amount": 100000,
        "currency_raw": "GBP",
        "categories": [{"scheme": "CPV", "code": "72000000"}],
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_parsing/test_uk_find_a_tender_parser.py -v`
Expected: FAIL — `app.parsing.uk_find_a_tender_parser` doesn't exist.

- [ ] **Step 3: Implement the parser**

Create `apps/api/app/parsing/__init__.py` (empty), then `apps/api/app/parsing/uk_find_a_tender_parser.py`:

```python
def parse(release: dict) -> dict:
    tender = release.get("tender", {})
    buyer = release.get("buyer", {})
    value = tender.get("value", {})
    tender_period = tender.get("tenderPeriod", {})
    items = tender.get("items", [])

    categories = [
        {
            "scheme": item["classification"]["scheme"],
            "code": item["classification"]["id"],
        }
        for item in items
        if "classification" in item
    ]

    buyer_party = next(
        (p for p in release.get("parties", []) if "buyer" in p.get("roles", [])),
        {},
    )
    country_name = buyer_party.get("address", {}).get("countryName")

    return {
        "source_notice_id": tender.get("id"),
        "title": tender.get("title"),
        "description": tender.get("description"),
        "buyer_name": buyer.get("name"),
        "country_name": country_name,
        "publication_date_raw": release.get("date"),
        "deadline_raw": tender_period.get("endDate"),
        "budget_amount": value.get("amount"),
        "currency_raw": value.get("currency"),
        "categories": categories,
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_parsing/test_uk_find_a_tender_parser.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/parsing apps/api/tests/test_parsing
git commit -m "feat(api): parse UK Find a Tender OCDS releases into flat fields"
```

---

### Task 8: Normalizer

**Files:**
- Create: `apps/api/app/normalization/__init__.py`
- Create: `apps/api/app/normalization/country_codes.py`
- Create: `apps/api/app/normalization/normalizer.py`
- Create: `apps/api/tests/test_normalization/__init__.py`
- Create: `apps/api/tests/test_normalization/test_normalizer.py`

**Interfaces:**
- Consumes: `Tender` model from Task 4 (`app.db.models.Tender`); parser output shape from Task 7.
- Produces: `to_iso2(country_name: str | None) -> str | None` (`app.normalization.country_codes`); `normalize(parsed: dict, source_id: str) -> Tender` (`app.normalization.normalizer`) — raises `ValueError` if the country name isn't recognized.

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_normalization/__init__.py` (empty) and `apps/api/tests/test_normalization/test_normalizer.py`:

```python
from datetime import datetime, timezone

from app.normalization.normalizer import normalize


def test_normalize_maps_parsed_fields_to_canonical_tender():
    parsed = {
        "source_notice_id": "notice-1",
        "title": "Case management software",
        "description": "Supply of a case management platform.",
        "buyer_name": "Example Council",
        "country_name": "United Kingdom",
        "publication_date_raw": "2026-09-01T00:00:00Z",
        "deadline_raw": "2026-09-30T23:59:59Z",
        "budget_amount": 100000,
        "currency_raw": "GBP",
        "categories": [{"scheme": "CPV", "code": "72000000"}],
    }

    tender = normalize(parsed, source_id="uk_find_a_tender")

    assert tender.tender_id == "uk_find_a_tender:notice-1"
    assert tender.country == "GB"
    assert tender.publication_date == datetime(2026, 9, 1, tzinfo=timezone.utc)
    assert tender.deadline == datetime(2026, 9, 30, 23, 59, 59, tzinfo=timezone.utc)
    assert tender.currency == "GBP"
    assert tender.categories == [{"scheme": "CPV", "code": "72000000"}]


def test_normalize_raises_on_unrecognized_country():
    parsed = {
        "source_notice_id": "notice-9",
        "title": "x",
        "description": None,
        "buyer_name": "x",
        "country_name": "Nowhereland",
        "publication_date_raw": "2026-09-01T00:00:00Z",
        "deadline_raw": None,
        "budget_amount": None,
        "currency_raw": None,
        "categories": [],
    }

    try:
        normalize(parsed, source_id="uk_find_a_tender")
        assert False, "expected ValueError"
    except ValueError:
        pass
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_normalization/test_normalizer.py -v`
Expected: FAIL — `app.normalization.normalizer` doesn't exist.

- [ ] **Step 3: Implement `app/normalization/country_codes.py`**

Create `apps/api/app/normalization/__init__.py` (empty), then:

```python
COUNTRY_NAME_TO_ISO2 = {
    "united kingdom": "GB",
    "ireland": "IE",
    "france": "FR",
    "germany": "DE",
}


def to_iso2(country_name: str | None) -> str | None:
    if not country_name:
        return None
    return COUNTRY_NAME_TO_ISO2.get(country_name.strip().lower())
```

- [ ] **Step 4: Implement `app/normalization/normalizer.py`**

```python
from datetime import datetime

from app.db.models import Tender
from app.normalization.country_codes import to_iso2


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def normalize(parsed: dict, source_id: str) -> Tender:
    country = to_iso2(parsed.get("country_name"))
    if country is None:
        raise ValueError(f"Unrecognized country name: {parsed.get('country_name')!r}")

    return Tender(
        tender_id=f"{source_id}:{parsed['source_notice_id']}",
        source_id=source_id,
        source_notice_id=parsed["source_notice_id"],
        title=parsed["title"],
        description=parsed.get("description"),
        buyer_name=parsed["buyer_name"],
        country=country,
        publication_date=_parse_datetime(parsed["publication_date_raw"]),
        deadline=_parse_datetime(parsed.get("deadline_raw")),
        budget_amount_min=parsed.get("budget_amount"),
        budget_amount_max=parsed.get("budget_amount"),
        currency=parsed.get("currency_raw"),
        categories=parsed.get("categories", []),
        attachments=[],
    )
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_normalization/test_normalizer.py -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/normalization apps/api/tests/test_normalization
git commit -m "feat(api): normalize parsed tenders into the canonical schema"
```

---

### Task 9: Ingestion pipeline with dedup/matching/alerts stubs

**Files:**
- Create: `apps/api/app/dedup/__init__.py`
- Create: `apps/api/app/dedup/service.py`
- Create: `apps/api/app/matching/__init__.py`
- Create: `apps/api/app/matching/service.py`
- Create: `apps/api/app/alerts/__init__.py`
- Create: `apps/api/app/alerts/service.py`
- Create: `apps/api/app/ingestion.py`
- Create: `apps/api/tests/test_ingestion.py`

**Interfaces:**
- Consumes: `UkFindATenderConnector`, `BASE_URL` (Task 6); `parse` (Task 7); `normalize` (Task 8); `RawArchive` (Task 5); `Source`, `Tender` (Task 4).
- Produces: `check_duplicate(tender) -> bool` (`app.dedup.service`); `score_tender(tender) -> None` (`app.matching.service`); `notify_new_tender(tender) -> None` (`app.alerts.service`); `ingest_source(source_id: str, db: Session, raw_archive: RawArchive) -> int` (`app.ingestion`), returning the count of tenders ingested.

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_ingestion.py`:

```python
import json
from pathlib import Path

import httpx
import respx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.connectors.uk_find_a_tender import BASE_URL
from app.db.base import Base
from app.db.models import Source, Tender
from app.ingestion import ingest_source
from app.raw_archive.storage import RawArchive

FIXTURES = Path(__file__).parent / "fixtures"


@respx.mock
def test_ingest_source_stores_tenders(tmp_path):
    page1 = json.loads((FIXTURES / "uk_ftts_page1.json").read_text())
    page2 = json.loads((FIXTURES / "uk_ftts_page2.json").read_text())

    respx.get(BASE_URL).mock(return_value=httpx.Response(200, json=page1))
    respx.get(f"{BASE_URL}?cursor=page2").mock(return_value=httpx.Response(200, json=page2))

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    db.add(
        Source(
            source_id="uk_find_a_tender",
            name="UK Find a Tender",
            country="GB",
            access_type="api",
            base_url=BASE_URL,
        )
    )
    db.commit()

    raw_archive = RawArchive(base_dir=str(tmp_path))

    count = ingest_source("uk_find_a_tender", db=db, raw_archive=raw_archive)

    assert count == 2
    tenders = db.query(Tender).order_by(Tender.tender_id).all()
    assert [t.source_notice_id for t in tenders] == ["notice-1", "notice-2"]
    assert (tmp_path / "uk_find_a_tender" / "notice-1.json").exists()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ingestion.py -v`
Expected: FAIL — `app.ingestion` doesn't exist.

- [ ] **Step 3: Implement the stub services**

Create `apps/api/app/dedup/__init__.py` (empty), then `apps/api/app/dedup/service.py`:

```python
import logging

logger = logging.getLogger(__name__)


def check_duplicate(tender) -> bool:
    """Stub: dedup is not implemented until a second source exists.

    Always reports "not a duplicate" so the pipeline can proceed.
    """
    logger.debug("dedup.check_duplicate not implemented yet, skipping for %s", tender.tender_id)
    return False
```

Create `apps/api/app/matching/__init__.py` (empty), then `apps/api/app/matching/service.py`:

```python
import logging

logger = logging.getLogger(__name__)


def score_tender(tender) -> None:
    """Stub: AI matching requires a company profile, which doesn't exist yet."""
    logger.debug("matching.score_tender not implemented yet, skipping for %s", tender.tender_id)
    return None
```

Create `apps/api/app/alerts/__init__.py` (empty), then `apps/api/app/alerts/service.py`:

```python
import logging

logger = logging.getLogger(__name__)


def notify_new_tender(tender) -> None:
    """Stub: alerting requires watchlists/users, which don't exist yet."""
    logger.debug("alerts.notify_new_tender not implemented yet, skipping for %s", tender.tender_id)
    return None
```

- [ ] **Step 4: Implement `app/ingestion.py`**

```python
import json
import logging

from sqlalchemy.orm import Session

from app.alerts.service import notify_new_tender
from app.connectors.uk_find_a_tender import UkFindATenderConnector
from app.dedup.service import check_duplicate
from app.matching.service import score_tender
from app.normalization.normalizer import normalize
from app.parsing.uk_find_a_tender_parser import parse
from app.raw_archive.storage import RawArchive

logger = logging.getLogger(__name__)

CONNECTORS = {
    "uk_find_a_tender": (UkFindATenderConnector, parse),
}


def ingest_source(source_id: str, db: Session, raw_archive: RawArchive) -> int:
    if source_id not in CONNECTORS:
        raise ValueError(f"Unknown source_id: {source_id}")

    connector_cls, parse_fn = CONNECTORS[source_id]
    connector = connector_cls()

    count = 0
    for release in connector.fetch_all():
        parsed = parse_fn(release)

        raw_archive.save(
            source_id=source_id,
            notice_id=parsed["source_notice_id"],
            content=json.dumps(release).encode("utf-8"),
        )

        tender = normalize(parsed, source_id=source_id)

        if check_duplicate(tender):
            continue

        db.merge(tender)
        score_tender(tender)
        notify_new_tender(tender)
        count += 1

    db.commit()
    return count
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_ingestion.py -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/dedup apps/api/app/matching apps/api/app/alerts apps/api/app/ingestion.py apps/api/tests/test_ingestion.py
git commit -m "feat(api): wire ingestion pipeline with dedup/matching/alert stubs"
```

---

### Task 10: API endpoints for tenders and sources

**Files:**
- Create: `apps/api/app/api/deps.py`
- Create: `apps/api/app/api/routers/tenders.py`
- Create: `apps/api/app/api/routers/sources.py`
- Modify: `apps/api/app/main.py`
- Create: `apps/api/tests/test_api/__init__.py`
- Create: `apps/api/tests/test_api/test_tenders.py`

**Interfaces:**
- Consumes: `SessionLocal` (Task 4, `app.db.base`); `Tender`, `Source` models (Task 4).
- Produces: `get_db()` dependency (`app.api.deps`); `GET /api/tenders` and `GET /api/sources` routes returning JSON matching `TenderOut`/`SourceOut` pydantic models.

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_api/__init__.py` (empty) and `apps/api/tests/test_api/test_tenders.py`:

```python
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_db
from app.db.base import Base
from app.db.models import Tender
from app.main import app


def _make_test_session_factory():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)


def test_list_tenders_returns_seeded_data():
    TestingSession = _make_test_session_factory()
    db = TestingSession()
    db.add(
        Tender(
            tender_id="uk_find_a_tender:notice-1",
            source_id="uk_find_a_tender",
            source_notice_id="notice-1",
            title="Case management software",
            buyer_name="Example Council",
            country="GB",
            publication_date=datetime(2026, 9, 1, tzinfo=timezone.utc),
            categories=[{"scheme": "CPV", "code": "72000000"}],
            attachments=[],
        )
    )
    db.commit()

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get("/api/tenders")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["tender_id"] == "uk_find_a_tender:notice-1"
    assert body[0]["title"] == "Case management software"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_api/test_tenders.py -v`
Expected: FAIL — `app.api.deps` and the `/api/tenders` route don't exist.

- [ ] **Step 3: Implement `app/api/deps.py`**

```python
from collections.abc import Iterator

from sqlalchemy.orm import Session

from app.db.base import SessionLocal


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Implement `app/api/routers/tenders.py`**

```python
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import Tender

router = APIRouter(prefix="/api/tenders", tags=["tenders"])


class TenderOut(BaseModel):
    tender_id: str
    source_id: str
    title: str
    buyer_name: str
    country: str
    publication_date: datetime
    deadline: datetime | None
    currency: str | None
    budget_amount_min: float | None
    budget_amount_max: float | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[TenderOut])
def list_tenders(db: Session = Depends(get_db)) -> list[Tender]:
    return db.query(Tender).order_by(Tender.publication_date.desc()).all()
```

- [ ] **Step 5: Implement `app/api/routers/sources.py`**

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import Source

router = APIRouter(prefix="/api/sources", tags=["sources"])


class SourceOut(BaseModel):
    source_id: str
    name: str
    country: str
    access_type: str
    enabled: bool

    model_config = {"from_attributes": True}


@router.get("", response_model=list[SourceOut])
def list_sources(db: Session = Depends(get_db)) -> list[Source]:
    return db.query(Source).all()
```

- [ ] **Step 6: Wire the routers into `app/main.py`**

```python
from fastapi import FastAPI

from app.api.routers import health, sources, tenders

app = FastAPI(title="Tender Intelligence API")

app.include_router(health.router)
app.include_router(tenders.router)
app.include_router(sources.router)
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pytest tests/test_api/test_tenders.py -v`
Expected: PASS.

- [ ] **Step 8: Run the full backend test suite**

Run: `pytest -v`
Expected: all tests from Tasks 3-10 PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/api/app/api apps/api/app/main.py apps/api/tests/test_api
git commit -m "feat(api): add /api/tenders and /api/sources endpoints"
```

---

### Task 11: Worker CLI

**Files:**
- Create: `apps/api/app/worker/__init__.py`
- Create: `apps/api/app/worker/run_once.py`
- Create: `apps/api/tests/test_worker/__init__.py`
- Create: `apps/api/tests/test_worker/test_run_once.py`

**Interfaces:**
- Consumes: `ingest_source` (Task 9, `app.ingestion`); `SessionLocal` (Task 4); `RawArchive` (Task 5); `settings` (Task 3).
- Produces: `run_once(source_id: str) -> int` and `main()` CLI entrypoint (`app.worker.run_once`).

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/test_worker/__init__.py` (empty) and `apps/api/tests/test_worker/test_run_once.py`:

```python
from unittest.mock import patch

from app.worker.run_once import run_once


def test_run_once_calls_ingest_source_with_source_id():
    with (
        patch("app.worker.run_once.ingest_source", return_value=3) as mock_ingest,
        patch("app.worker.run_once.SessionLocal") as mock_session_local,
    ):
        mock_db = mock_session_local.return_value
        result = run_once("uk_find_a_tender")

    assert result == 3
    mock_ingest.assert_called_once()
    args, kwargs = mock_ingest.call_args
    assert args[0] == "uk_find_a_tender"
    assert kwargs["db"] is mock_db
    mock_db.close.assert_called_once()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_worker/test_run_once.py -v`
Expected: FAIL — `app.worker.run_once` doesn't exist.

- [ ] **Step 3: Implement `app/worker/run_once.py`**

Create `apps/api/app/worker/__init__.py` (empty), then:

```python
import argparse
import logging

from app.config import settings
from app.db.base import SessionLocal
from app.ingestion import ingest_source
from app.raw_archive.storage import RawArchive

logger = logging.getLogger(__name__)


def run_once(source_id: str) -> int:
    db = SessionLocal()
    raw_archive = RawArchive(base_dir=settings.raw_archive_dir)
    try:
        count = ingest_source(source_id, db=db, raw_archive=raw_archive)
        logger.info("ingested %s tenders from %s", count, source_id)
        return count
    finally:
        db.close()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Run one ingestion pass for a source")
    parser.add_argument("source_id")
    args = parser.parse_args()
    run_once(args.source_id)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_worker/test_run_once.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/worker apps/api/tests/test_worker
git commit -m "feat(api): add worker CLI for one-off ingestion runs"
```

---

### Task 12: Frontend scaffold with tender list page

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/tenders/page.tsx`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/components/TenderTable.tsx`
- Create: `apps/web/components/TenderTable.test.tsx`

**Interfaces:**
- Produces: `TenderListItem` interface and `fetchTenders(): Promise<TenderListItem[]>` (`apps/web/lib/api.ts`); `TenderTable` component (`apps/web/components/TenderTable.tsx`) taking `{ tenders: TenderListItem[] }`.

- [ ] **Step 1: Create package config**

Create `apps/web/package.json`:

```json
{
  "name": "@tender-intel/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.2",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

Create `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Create `apps/web/next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

Create `apps/web/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

Create `apps/web/postcss.config.mjs`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `apps/web/vitest.config.ts`:

```ts
import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `apps/web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing test**

Create `apps/web/lib/api.ts` (interface only, no implementation yet — needed so the test file type-checks):

```ts
export interface TenderListItem {
  tender_id: string;
  source_id: string;
  title: string;
  buyer_name: string;
  country: string;
  publication_date: string;
  deadline: string | null;
  currency: string | null;
  budget_amount_min: number | null;
  budget_amount_max: number | null;
}
```

Create `apps/web/components/TenderTable.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TenderListItem } from "@/lib/api";
import { TenderTable } from "./TenderTable";

const sampleTender: TenderListItem = {
  tender_id: "uk_find_a_tender:notice-1",
  source_id: "uk_find_a_tender",
  title: "Case management software",
  buyer_name: "Example Council",
  country: "GB",
  publication_date: "2026-09-01T00:00:00Z",
  deadline: "2026-09-30T23:59:59Z",
  currency: "GBP",
  budget_amount_min: 100000,
  budget_amount_max: 100000,
};

describe("TenderTable", () => {
  it("renders a row per tender", () => {
    render(<TenderTable tenders={[sampleTender]} />);

    expect(screen.getByText("Case management software")).toBeInTheDocument();
    expect(screen.getByText("Example Council")).toBeInTheDocument();
  });

  it("shows an empty state when there are no tenders", () => {
    render(<TenderTable tenders={[]} />);

    expect(screen.getByText("No tenders found.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm install && pnpm --filter @tender-intel/web test`
Expected: FAIL — `./TenderTable` doesn't exist.

- [ ] **Step 4: Implement `components/TenderTable.tsx`**

```tsx
import type { TenderListItem } from "@/lib/api";

export function TenderTable({ tenders }: { tenders: TenderListItem[] }) {
  if (tenders.length === 0) {
    return <p className="text-gray-500">No tenders found.</p>;
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b">
          <th className="py-2 pr-4">Title</th>
          <th className="py-2 pr-4">Buyer</th>
          <th className="py-2 pr-4">Country</th>
          <th className="py-2 pr-4">Deadline</th>
          <th className="py-2 pr-4">Budget</th>
        </tr>
      </thead>
      <tbody>
        {tenders.map((tender) => (
          <tr key={tender.tender_id} className="border-b">
            <td className="py-2 pr-4">{tender.title}</td>
            <td className="py-2 pr-4">{tender.buyer_name}</td>
            <td className="py-2 pr-4">{tender.country}</td>
            <td className="py-2 pr-4">
              {tender.deadline ? new Date(tender.deadline).toLocaleDateString() : "—"}
            </td>
            <td className="py-2 pr-4">
              {tender.budget_amount_max
                ? `${tender.currency ?? ""} ${tender.budget_amount_max.toLocaleString()}`
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @tender-intel/web test`
Expected: PASS (2 tests).

- [ ] **Step 6: Implement `lib/api.ts` fetch function**

Append to `apps/web/lib/api.ts` (the `TenderListItem` interface from Step 2 stays):

```ts
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

export async function fetchTenders(): Promise<TenderListItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/tenders`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tenders: ${response.status}`);
  }

  return response.json();
}
```

- [ ] **Step 7: Implement the pages and layout**

Create `apps/web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `apps/web/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Tender Intelligence",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
```

Create `apps/web/app/page.tsx`:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Tender Intelligence</h1>
      <p className="mt-2">
        <Link className="text-blue-600 underline" href="/tenders">
          View tenders
        </Link>
      </p>
    </main>
  );
}
```

Create `apps/web/app/tenders/page.tsx`:

```tsx
import { TenderTable } from "@/components/TenderTable";
import { fetchTenders } from "@/lib/api";

export default async function TendersPage() {
  const tenders = await fetchTenders();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Tenders</h1>
      <div className="mt-4">
        <TenderTable tenders={tenders} />
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Type-check the frontend**

Run: `pnpm --filter @tender-intel/web typecheck`
Expected: no type errors.

- [ ] **Step 9: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold Next.js app with tender list page"
```

---

### Task 13: Full Docker Compose wiring, Dockerfiles, and README

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: everything built in Tasks 1-12.
- Produces: a runnable `docker compose up --build` stack (`api`, `worker`, `web`, `postgres`, `redis`, `opensearch`).

- [ ] **Step 1: Create `apps/api/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir -e ".[dev]"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create `apps/web/Dockerfile`**

```dockerfile
FROM node:20-slim

WORKDIR /repo

COPY . .
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @tender-intel/web build

WORKDIR /repo/apps/web
CMD ["pnpm", "start"]
```

- [ ] **Step 3: Update `docker-compose.yml`** to add `api`, `worker`, `web` services alongside the existing `postgres`, `redis`, `opensearch`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tender
      POSTGRES_PASSWORD: tender
      POSTGRES_DB: tender_intel
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  opensearch:
    image: opensearchproject/opensearch:2.15.0
    environment:
      - discovery.type=single-node
      - plugins.security.disabled=true
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

  api:
    build:
      context: ./apps/api
    environment:
      DATABASE_URL: postgresql+psycopg://tender:tender@postgres:5432/tender_intel
      RAW_ARCHIVE_DIR: /data/raw_archive
    volumes:
      - raw_archive_data:/data/raw_archive
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  worker:
    build:
      context: ./apps/api
    command: ["python", "-m", "app.worker.run_once", "uk_find_a_tender"]
    environment:
      DATABASE_URL: postgresql+psycopg://tender:tender@postgres:5432/tender_intel
      RAW_ARCHIVE_DIR: /data/raw_archive
    volumes:
      - raw_archive_data:/data/raw_archive
    depends_on:
      - postgres

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      API_BASE_URL: http://api:8000
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
  raw_archive_data:
```

- [ ] **Step 4: Verify the compose file**

Run: `docker compose config`
Expected: prints the resolved config with `api`, `worker`, `web`, `postgres`, `redis`, `opensearch` and no errors.

- [ ] **Step 5: Write the full `README.md`**

```markdown
# Tender Intelligence

AI-assisted procurement/tender discovery platform. See
`docs/superpowers/specs/2026-09-04-tender-intelligence-scaffold-design.md`
for the scaffold design.

## Structure

- `apps/api` — FastAPI backend (ingestion, parsing, normalization, API)
- `apps/web` — Next.js frontend
- `packages/schema` — shared canonical tender schema (JSON Schema + TS types)

## Local development

### Prerequisites

- Docker + Docker Compose
- Node.js 20+, pnpm
- Python 3.11+

### Run everything with Docker Compose

\`\`\`bash
docker compose up --build
\`\`\`

- API: http://localhost:8000 (interactive docs at /docs)
- Web: http://localhost:3000
- Postgres: localhost:5432
- OpenSearch: http://localhost:9200

The database schema is not created automatically by `docker compose up` —
run the migration once against the running Postgres container:

\`\`\`bash
docker compose run --rm api alembic upgrade head
\`\`\`

You also need at least one row in `sources` before ingestion will find a
connector to run. Insert it once:

\`\`\`bash
docker compose exec postgres psql -U tender -d tender_intel -c \
  "insert into sources (source_id, name, country, access_type, base_url, enabled) values ('uk_find_a_tender', 'UK Find a Tender', 'GB', 'api', 'https://www.find-tender.service.gov.uk', true);"
\`\`\`

Then run one ingestion pass:

\`\`\`bash
docker compose run --rm worker
\`\`\`

Refresh http://localhost:3000/tenders to see the ingested tenders.

### Run backend locally without Docker

\`\`\`bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
uvicorn app.main:app --reload
\`\`\`

### Run frontend locally without Docker

\`\`\`bash
pnpm install
pnpm --filter @tender-intel/web dev
\`\`\`

### Run the shared schema package tests

\`\`\`bash
pnpm --filter @tender-intel/schema test
\`\`\`

## What's implemented

One working end-to-end slice: fetch tenders from UK Find a Tender's OCDS
API, parse and normalize into the canonical schema, store in Postgres,
and list them via the API and web UI. Deduplication, AI matching,
alerting, auth, and billing are stubbed or absent — see the design doc's
"Out of Scope" section.
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/Dockerfile apps/web/Dockerfile docker-compose.yml README.md
git commit -m "chore: wire full docker-compose stack and document local setup"
```
