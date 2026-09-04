# Tender Intelligence Scaffold Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Tender Intelligence monorepo against the
technical spec's architecture: NestJS + Prisma + BullMQ + MinIO,
event/outbox-driven, with one real end-to-end slice — fetch UK Find a
Tender OCDS notices, store raw payloads in object storage, parse and
version them into the canonical schema through a queued job, write a
transactional outbox event, relay it, and list tenders through a
cursor-paginated API and a Next.js page.

**Architecture:** Monorepo with `apps/api` (NestJS, hosting both the
HTTP API and BullMQ worker processes in one codebase per spec §2's
"modular monolith"), `apps/web` (Next.js), `packages/schema` (shared
canonical tender contract). Ingestion follows spec §7: adapter →
object storage → `raw_records` → queued parse job → normalize/version →
transactional outbox → relay.

**Tech Stack:** Node 20+/TypeScript/NestJS/Prisma/BullMQ/ioredis
(backend); Next.js (App Router)/TypeScript/Tailwind/Vitest (frontend);
Postgres 16/Redis/MinIO via Docker Compose. Jest for backend tests.

**Spec:** `docs/superpowers/specs/2026-09-04-tender-intelligence-scaffold-v2-design.md`
(and the technical spec it implements,
`/Users/pongpanot_s/Documents/Codex/2026-09-04/referenced-chatgpt-conversation-this-is-an/outputs/tender-intelligence-technical-spec-th.md`)

## Global Constraints

- API framework: NestJS (not Fastify standalone, not Express-only).
- ORM: Prisma.
- Object storage: MinIO via Docker Compose (S3-compatible client), not a local disk stub.
- Queue: BullMQ backed by Redis.
- DB tables this scaffold creates: `source_registry`, `source_configs`, `source_runs`, `raw_records`, `tenders`, `tender_versions`, `tender_notices`, `outbox_events` — no others.
- First source: UK Find a Tender only (OCDS JSON API, no auth).
- Cursor pagination on `GET /v1/tenders`: opaque base64, not HMAC-signed (documented simplification — no auth system exists yet).
- Response envelope: `{ data, page: { nextCursor, hasMore }, meta: { requestId } }`; errors: `{ error: { code, message, details, requestId } }`.
- Out of scope: auth/RBAC/organizations, company profiles, matching/AI, notifications, search indexing, admin console, billing, any source beyond UK Find a Tender, document/OCR pipeline.
- Integration tests that touch DB/queue/object storage run against Docker Compose services (Postgres/Redis/MinIO), not in-memory substitutes.

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
- Produces: `docker-compose.yml` with `postgres`, `redis`, `minio` services (extended with `api`/`worker`/`web` in Task 15).

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
.next/
dist/
build/
.env
*.log
minio_data/
postgres_data/
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
DATABASE_URL=postgresql://tender:tender@localhost:5432/tender_intel
REDIS_URL=redis://localhost:6379
OBJECT_STORAGE_ENDPOINT=localhost
OBJECT_STORAGE_PORT=9000
OBJECT_STORAGE_USE_SSL=false
OBJECT_STORAGE_ACCESS_KEY=tender
OBJECT_STORAGE_SECRET_KEY=tender12345
OBJECT_STORAGE_BUCKET=raw-records
APP_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001
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

  minio:
    image: minio/minio:RELEASE.2024-10-13T13-34-11Z
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: tender
      MINIO_ROOT_PASSWORD: tender12345
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

- [ ] **Step 6: Create placeholder `README.md`**

```markdown
# Tender Intelligence

Scaffold in progress. See `docs/superpowers/specs/2026-09-04-tender-intelligence-scaffold-v2-design.md`.
```

- [ ] **Step 7: Verify**

Run: `docker compose config`
Expected: resolved config prints with no errors.

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
- Produces: `CanonicalTender` TS interface and `tenderSchema` JSON export from `@tender-intel/schema`, matching spec §6's canonical tender JSON shape.

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
      id: "ten_01J000000000000000000001",
      source: { id: "uk_find_a_tender", name: "UK Find a Tender", countryCode: "GB" },
      externalReferences: [{ type: "notice_id", value: "notice-1" }],
      title: "Case management platform implementation",
      status: "open",
      publishedAt: "2026-09-01T00:00:00Z",
      buyer: { name: "Example Council", countryCode: "GB" },
      cpvCodes: ["72000000"],
      sourceUrl: "https://www.find-tender.service.gov.uk/notice/notice-1",
      provenance: { version: 1, contentHash: "sha256:abc", lastSourceSeenAt: "2026-09-01T00:00:00Z" },
    };

    const valid = validate(sample);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

  it("rejects a tender missing required fields", () => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    expect(validate({ id: "ten_1" })).toBe(false);
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
  "scripts": { "test": "vitest run" },
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

export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm install && pnpm --filter @tender-intel/schema test`
Expected: FAIL — `tender.schema.json` and `./index` don't exist yet.

- [ ] **Step 4: Write the canonical schema**

Create `packages/schema/tender.schema.json` (fields per spec §6's canonical tender JSON example):

```json
{
  "$id": "https://tender-intel/schema/tender.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalTender",
  "type": "object",
  "required": ["id", "source", "externalReferences", "title", "status", "publishedAt", "buyer", "sourceUrl", "provenance"],
  "properties": {
    "id": { "type": "string" },
    "source": {
      "type": "object",
      "required": ["id", "name", "countryCode"],
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "countryCode": { "type": "string" }
      }
    },
    "externalReferences": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "value"],
        "properties": { "type": { "type": "string" }, "value": { "type": "string" } }
      }
    },
    "title": { "type": "string" },
    "summary": { "type": ["string", "null"] },
    "status": { "type": "string", "enum": ["open", "closed", "expired", "cancelled"] },
    "noticeType": { "type": ["string", "null"] },
    "publishedAt": { "type": "string", "format": "date-time" },
    "deadlineAt": { "type": ["string", "null"], "format": "date-time" },
    "buyer": {
      "type": "object",
      "required": ["name", "countryCode"],
      "properties": {
        "name": { "type": "string" },
        "countryCode": { "type": "string" },
        "region": { "type": ["string", "null"] }
      }
    },
    "value": {
      "type": ["object", "null"],
      "properties": {
        "min": { "type": ["number", "null"] },
        "max": { "type": ["number", "null"] },
        "currency": { "type": ["string", "null"] },
        "kind": { "type": ["string", "null"] }
      }
    },
    "cpvCodes": { "type": "array", "items": { "type": "string" } },
    "sourceUrl": { "type": "string" },
    "provenance": {
      "type": "object",
      "required": ["version", "contentHash", "lastSourceSeenAt"],
      "properties": {
        "version": { "type": "integer" },
        "contentHash": { "type": "string" },
        "lastSourceSeenAt": { "type": "string", "format": "date-time" }
      }
    }
  },
  "additionalProperties": true
}
```

Create `packages/schema/src/index.ts`:

```ts
export interface TenderExternalReference {
  type: string;
  value: string;
}

export interface CanonicalTender {
  id: string;
  source: { id: string; name: string; countryCode: string };
  externalReferences: TenderExternalReference[];
  title: string;
  summary?: string | null;
  status: "open" | "closed" | "expired" | "cancelled";
  noticeType?: string | null;
  publishedAt: string;
  deadlineAt?: string | null;
  buyer: { name: string; countryCode: string; region?: string | null };
  value?: { min?: number | null; max?: number | null; currency?: string | null; kind?: string | null } | null;
  cpvCodes: string[];
  sourceUrl: string;
  provenance: { version: number; contentHash: string; lastSourceSeenAt: string };
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

### Task 3: Backend project skeleton (NestJS + config + health)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/config/env.validation.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.controller.spec.ts`

**Interfaces:**
- Produces: `validateEnv(config: Record<string, unknown>)` (`src/config/env.validation.ts`) throwing on missing required vars; `AppModule` (`src/app.module.ts`); `HealthController` with `GET /health`.

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@tender-intel/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.6",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^10.4.6",
    "@nestjs/platform-express": "^10.4.6",
    "@prisma/client": "^5.20.0",
    "bullmq": "^5.21.2",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "ioredis": "^5.4.1",
    "minio": "^8.0.2",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.5",
    "@nestjs/testing": "^10.4.6",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.13",
    "@types/node": "^22.7.5",
    "jest": "^29.7.0",
    "prisma": "^5.20.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Create TypeScript/Nest config**

Create `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "baseUrl": "./"
  }
}
```

Create `apps/api/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*spec.ts"]
}
```

Create `apps/api/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

Create `apps/api/jest.config.ts`:

```ts
import type { Config } from "jest";

const config: Config = {
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.ts$": "ts-jest" },
  moduleFileExtensions: ["ts", "js", "json"],
};

export default config;
```

- [ ] **Step 3: Write the failing test**

Create `apps/api/src/health/health.controller.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns ok status", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.getHealth()).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd apps/api
pnpm install
pnpm test
```

Expected: FAIL — `./health.controller` doesn't exist.

- [ ] **Step 5: Implement `src/health/health.controller.ts`**

```ts
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): { status: string } {
    return { status: "ok" };
  }
}
```

- [ ] **Step 6: Implement `src/config/env.validation.ts`**

```ts
export interface AppEnv {
  DATABASE_URL: string;
  REDIS_URL: string;
  OBJECT_STORAGE_ENDPOINT: string;
  OBJECT_STORAGE_PORT: string;
  OBJECT_STORAGE_USE_SSL: string;
  OBJECT_STORAGE_ACCESS_KEY: string;
  OBJECT_STORAGE_SECRET_KEY: string;
  OBJECT_STORAGE_BUCKET: string;
  APP_BASE_URL: string;
}

const REQUIRED_KEYS: (keyof AppEnv)[] = [
  "DATABASE_URL",
  "REDIS_URL",
  "OBJECT_STORAGE_ENDPOINT",
  "OBJECT_STORAGE_PORT",
  "OBJECT_STORAGE_USE_SSL",
  "OBJECT_STORAGE_ACCESS_KEY",
  "OBJECT_STORAGE_SECRET_KEY",
  "OBJECT_STORAGE_BUCKET",
  "APP_BASE_URL",
];

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const missing = REQUIRED_KEYS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  return config as unknown as AppEnv;
}
```

- [ ] **Step 7: Implement `src/app.module.ts` and `src/main.ts`**

```ts
// src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
  controllers: [HealthController],
})
export class AppModule {}
```

```ts
// src/main.ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/api/package.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/jest.config.ts apps/api/src
git commit -m "feat(api): scaffold NestJS app with env validation and health endpoint"
```

---

### Task 4: Prisma schema and initial migration

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.service.spec.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` from Task 3 env validation.
- Produces: Prisma models `SourceRegistry`, `SourceConfig`, `SourceRun`, `RawRecord`, `Tender`, `TenderVersion`, `TenderNotice`, `OutboxEvent` (client generated as `@prisma/client`); `PrismaService` (`src/prisma/prisma.service.ts`) extending `PrismaClient` with `onModuleInit`/`onModuleDestroy`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/prisma/prisma.service.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  it("connects and can query the sources table", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    const prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();

    const count = await prisma.sourceRegistry.count();
    expect(typeof count).toBe("number");

    await prisma.onModuleDestroy();
  });
});
```

This test needs Postgres reachable at `DATABASE_URL` — start it first:
`docker compose up -d postgres`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- prisma.service`
Expected: FAIL — `./prisma.service` and the Prisma client don't exist yet.

- [ ] **Step 3: Write `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model SourceRegistry {
  id           String   @id
  name         String
  countryCode  String   @map("country_code")
  accessMethod String   @map("access_method")
  policyStatus String   @map("policy_status")
  adapterKey   String   @map("adapter_key")
  createdAt    DateTime @default(now()) @map("created_at")

  configs SourceConfig[]

  @@map("source_registry")
}

model SourceConfig {
  id          String   @id @default(uuid())
  sourceId    String   @map("source_id")
  environment String
  schedule    String?
  queryJson   Json?    @map("query_json")
  enabled     Boolean  @default(true)

  source SourceRegistry @relation(fields: [sourceId], references: [id])
  runs   SourceRun[]

  @@map("source_configs")
}

model SourceRun {
  id            String    @id @default(uuid())
  sourceConfigId String   @map("source_config_id")
  status        String
  cursorBefore  String?   @map("cursor_before")
  cursorAfter   String?   @map("cursor_after")
  itemsFetched  Int       @default(0) @map("items_fetched")
  startedAt     DateTime  @default(now()) @map("started_at")
  finishedAt    DateTime? @map("finished_at")

  sourceConfig SourceConfig @relation(fields: [sourceConfigId], references: [id])
  rawRecords   RawRecord[]

  @@map("source_runs")
}

model RawRecord {
  id           String   @id @default(uuid())
  sourceRunId  String   @map("source_run_id")
  externalId   String   @map("external_id")
  payloadUri   String   @map("payload_uri")
  payloadHash  String   @map("payload_hash")
  receivedAt   DateTime @default(now()) @map("received_at")

  sourceRun      SourceRun       @relation(fields: [sourceRunId], references: [id])
  tenderNotices  TenderNotice[]

  @@unique([sourceRunId, externalId, payloadHash], name: "raw_records_source_external_hash_uq")
  @@map("raw_records")
}

model Tender {
  id               String   @id @default(uuid())
  canonicalKey     String   @unique @map("canonical_key")
  sourceId         String   @map("source_id")
  currentVersionId String?  @unique @map("current_version_id")
  status           String   @default("open")
  firstSeenAt      DateTime @default(now()) @map("first_seen_at")

  versions TenderVersion[] @relation("TenderToVersions")
  notices  TenderNotice[]

  @@map("tenders")
}

model TenderVersion {
  id            String   @id @default(uuid())
  tenderId      String   @map("tender_id")
  contentHash   String   @map("content_hash")
  normalizedJson Json    @map("normalized_json")
  publishedAt   DateTime @map("published_at")
  deadlineAt    DateTime? @map("deadline_at")
  createdAt     DateTime @default(now()) @map("created_at")

  tender Tender @relation("TenderToVersions", fields: [tenderId], references: [id])

  @@unique([tenderId, contentHash], name: "tender_versions_tender_hash_uq")
  @@index([deadlineAt], name: "tender_versions_deadline_open_idx")
  @@map("tender_versions")
}

model TenderNotice {
  id               String  @id @default(uuid())
  tenderId         String  @map("tender_id")
  sourceId         String  @map("source_id")
  sourceExternalId String  @map("source_external_id")
  noticeType       String? @map("notice_type")
  sourceUrl        String  @map("source_url")
  rawRecordId      String  @map("raw_record_id")

  tender    Tender    @relation(fields: [tenderId], references: [id])
  rawRecord RawRecord @relation(fields: [rawRecordId], references: [id])

  @@unique([sourceId, sourceExternalId], name: "tender_notices_source_external_uq")
  @@map("tender_notices")
}

model OutboxEvent {
  id            String    @id @default(uuid())
  eventType     String    @map("event_type")
  aggregateType String    @map("aggregate_type")
  aggregateId   String    @map("aggregate_id")
  payloadJson   Json      @map("payload_json")
  createdAt     DateTime  @default(now()) @map("created_at")
  publishedAt   DateTime? @map("published_at")

  @@map("outbox_events")
}
```

- [ ] **Step 4: Generate the client and run the migration**

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

Expected: creates `apps/api/prisma/migrations/<timestamp>_init/migration.sql` and applies it to the `tender_intel` database (requires `docker compose up -d postgres` running with `DATABASE_URL` from `.env`).

- [ ] **Step 5: Implement `src/prisma/prisma.service.ts`**

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- prisma.service`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma apps/api/src/prisma
git commit -m "feat(api): add Prisma schema and initial migration for ingestion tables"
```

---

### Task 5: Raw storage module (MinIO client wrapper)

**Files:**
- Create: `apps/api/src/raw-storage/raw-storage.service.ts`
- Create: `apps/api/src/raw-storage/raw-storage.service.spec.ts`
- Create: `apps/api/src/raw-storage/raw-storage.module.ts`

**Interfaces:**
- Consumes: `OBJECT_STORAGE_*` env vars from Task 3.
- Produces: `RawStorageService` with `save(key: string, content: Buffer): Promise<string>` (returns the object key/URI) and `load(key: string): Promise<Buffer>`; ensures the configured bucket exists.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/raw-storage/raw-storage.service.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { RawStorageService } from "./raw-storage.service";
import { validateEnv } from "../config/env.validation";

describe("RawStorageService", () => {
  it("saves and loads a raw payload round trip", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      providers: [RawStorageService],
    }).compile();

    const service = moduleRef.get(RawStorageService);
    await service.onModuleInit();

    const key = `test/${Date.now()}.json`;
    await service.save(key, Buffer.from('{"ocid":"abc"}'));

    const loaded = await service.load(key);
    expect(loaded.toString("utf-8")).toBe('{"ocid":"abc"}');
  });
});
```

This test needs MinIO reachable — start it first: `docker compose up -d minio`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- raw-storage`
Expected: FAIL — `./raw-storage.service` doesn't exist.

- [ ] **Step 3: Implement `src/raw-storage/raw-storage.service.ts`**

```ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";
import type { AppEnv } from "../config/env.validation";

@Injectable()
export class RawStorageService implements OnModuleInit {
  private client!: Client;
  private bucket!: string;

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  async onModuleInit() {
    this.bucket = this.config.get("OBJECT_STORAGE_BUCKET", { infer: true });
    this.client = new Client({
      endPoint: this.config.get("OBJECT_STORAGE_ENDPOINT", { infer: true }),
      port: Number(this.config.get("OBJECT_STORAGE_PORT", { infer: true })),
      useSSL: this.config.get("OBJECT_STORAGE_USE_SSL", { infer: true }) === "true",
      accessKey: this.config.get("OBJECT_STORAGE_ACCESS_KEY", { infer: true }),
      secretKey: this.config.get("OBJECT_STORAGE_SECRET_KEY", { infer: true }),
    });

    const exists = await this.client.bucketExists(this.bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async save(key: string, content: Buffer): Promise<string> {
    await this.client.putObject(this.bucket, key, content);
    return key;
  }

  async load(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
```

- [ ] **Step 4: Implement `src/raw-storage/raw-storage.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { RawStorageService } from "./raw-storage.service";

@Module({
  providers: [RawStorageService],
  exports: [RawStorageService],
})
export class RawStorageModule {}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- raw-storage`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/raw-storage
git commit -m "feat(api): add MinIO-backed raw storage service"
```

---

### Task 6: Source adapter interface and UK Find a Tender adapter

**Files:**
- Create: `apps/api/src/adapters/source-adapter.interface.ts`
- Create: `apps/api/src/adapters/uk-find-a-tender.adapter.ts`
- Create: `apps/api/test/fixtures/uk-ftts-page1.json`
- Create: `apps/api/test/fixtures/uk-ftts-page2.json`
- Create: `apps/api/src/adapters/uk-find-a-tender.adapter.spec.ts`

**Interfaces:**
- Produces: `SourceAdapter` interface (`src/adapters/source-adapter.interface.ts`) matching spec §7 exactly (`discover`, `healthCheck`); `UkFindATenderAdapter` implementing it, with `sourceId = "uk_find_a_tender"`, constructor `(baseUrl?: string)`, `discover(): AsyncIterable<DiscoveredRecord>` where `DiscoveredRecord` carries `{ externalId, sourceUrl, publishedAt, lightweightPayload }` (the raw OCDS release goes in `lightweightPayload`).

- [ ] **Step 1: Create fixture files**

Create `apps/api/test/fixtures/uk-ftts-page1.json`:

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
        { "id": "buyer-1", "roles": ["buyer"], "name": "Example Council", "address": { "countryName": "United Kingdom" } }
      ]
    }
  ],
  "links": { "next": "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages?cursor=page2" }
}
```

Create `apps/api/test/fixtures/uk-ftts-page2.json`:

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
        { "id": "buyer-1", "roles": ["buyer"], "name": "Another Council", "address": { "countryName": "United Kingdom" } }
      ]
    }
  ],
  "links": {}
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/adapters/uk-find-a-tender.adapter.spec.ts`:

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import nock from "nock";
import { UkFindATenderAdapter } from "./uk-find-a-tender.adapter";

const FIXTURES = path.join(__dirname, "../../test/fixtures");
const HOST = "https://www.find-tender.service.gov.uk";
const PATH = "/api/1.0/ocdsReleasePackages";

describe("UkFindATenderAdapter", () => {
  afterEach(() => nock.cleanAll());

  it("follows pagination via discover()", async () => {
    const page1 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8"));
    const page2 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page2.json"), "utf-8"));

    nock(HOST).get(PATH).reply(200, page1);
    nock(HOST).get(PATH).query({ cursor: "page2" }).reply(200, page2);

    const adapter = new UkFindATenderAdapter(`${HOST}${PATH}`);
    const records = [];
    for await (const record of adapter.discover()) {
      records.push(record);
    }

    expect(records).toHaveLength(2);
    expect(records[0].externalId).toBe("notice-1");
    expect(records[1].externalId).toBe("notice-2");
  });
});
```

Add `nock` as a dev dependency: edit `apps/api/package.json` `devDependencies` to add `"nock": "^13.5.5"`.

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm install && pnpm test -- uk-find-a-tender`
Expected: FAIL — `./uk-find-a-tender.adapter` doesn't exist.

- [ ] **Step 4: Implement `src/adapters/source-adapter.interface.ts`**

```ts
export interface DiscoveredRecord {
  externalId: string;
  sourceUrl: string;
  publishedAt?: string;
  updatedAt?: string;
  cursor?: string;
  lightweightPayload?: unknown;
}

export interface SourceHealth {
  ok: boolean;
  checkedAt: string;
  detail?: string;
}

export interface SourceAdapter {
  sourceId: string;
  discover(): AsyncIterable<DiscoveredRecord>;
  healthCheck(): Promise<SourceHealth>;
}
```

- [ ] **Step 5: Implement `src/adapters/uk-find-a-tender.adapter.ts`**

```ts
import type { DiscoveredRecord, SourceAdapter, SourceHealth } from "./source-adapter.interface";

export const UK_FIND_A_TENDER_BASE_URL =
  "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";

interface OcdsReleasePackage {
  releases: Array<{
    tender?: { id?: string };
    date?: string;
  }>;
  links?: { next?: string };
}

export class UkFindATenderAdapter implements SourceAdapter {
  sourceId = "uk_find_a_tender";

  constructor(private readonly baseUrl: string = UK_FIND_A_TENDER_BASE_URL) {}

  async *discover(): AsyncIterable<DiscoveredRecord> {
    let url: string | undefined = this.baseUrl;

    while (url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`UK Find a Tender fetch failed: ${response.status}`);
      }
      const payload = (await response.json()) as OcdsReleasePackage;

      for (const release of payload.releases) {
        const externalId = release.tender?.id;
        if (!externalId) continue;

        yield {
          externalId,
          sourceUrl: `https://www.find-tender.service.gov.uk/notice/${externalId}`,
          publishedAt: release.date,
          lightweightPayload: release,
        };
      }

      url = payload.links?.next;
    }
  }

  async healthCheck(): Promise<SourceHealth> {
    const response = await fetch(this.baseUrl, { method: "HEAD" }).catch(() => null);
    return {
      ok: response?.ok ?? false,
      checkedAt: new Date().toISOString(),
    };
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- uk-find-a-tender`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/adapters apps/api/test/fixtures apps/api/package.json
git commit -m "feat(api): add SourceAdapter contract and UK Find a Tender adapter"
```

---

### Task 7: BullMQ queue module

**Files:**
- Create: `apps/api/src/queue/queue.constants.ts`
- Create: `apps/api/src/queue/queue.module.ts`
- Create: `apps/api/src/queue/queue.module.spec.ts`

**Interfaces:**
- Consumes: `REDIS_URL` from Task 3.
- Produces: `PARSE_QUEUE` token and queue name constant `"parse-raw-record"` (`src/queue/queue.constants.ts`); `QueueModule` (global) registering a BullMQ `Queue` provider injectable via `@Inject(PARSE_QUEUE)`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/queue/queue.module.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { Queue } from "bullmq";
import { QueueModule } from "./queue.module";
import { PARSE_QUEUE } from "./queue.constants";
import { validateEnv } from "../config/env.validation";

describe("QueueModule", () => {
  it("provides a BullMQ Queue for the parse queue", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), QueueModule],
    }).compile();

    const queue = moduleRef.get<Queue>(PARSE_QUEUE);
    expect(queue).toBeInstanceOf(Queue);
    expect(queue.name).toBe("parse-raw-record");

    await queue.close();
  });
});
```

This test needs Redis reachable — start it first: `docker compose up -d redis`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- queue.module`
Expected: FAIL — `./queue.module` doesn't exist.

- [ ] **Step 3: Implement `src/queue/queue.constants.ts`**

```ts
export const PARSE_QUEUE = "PARSE_QUEUE";
export const PARSE_QUEUE_NAME = "parse-raw-record";

export interface ParseRawRecordJob {
  rawRecordId: string;
}
```

- [ ] **Step 4: Implement `src/queue/queue.module.ts`**

```ts
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import type { AppEnv } from "../config/env.validation";
import { PARSE_QUEUE, PARSE_QUEUE_NAME } from "./queue.constants";

@Global()
@Module({
  providers: [
    {
      provide: PARSE_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>) =>
        new Queue(PARSE_QUEUE_NAME, {
          connection: { url: config.get("REDIS_URL", { infer: true }) } as never,
        }),
    },
  ],
  exports: [PARSE_QUEUE],
})
export class QueueModule {}
```

Note: BullMQ's `connection` option accepts a URL string directly as of v5;
if the installed version's types reject it, replace with
`new Redis(config.get("REDIS_URL", { infer: true }))` from `ioredis` and
pass that instance instead.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- queue.module`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/queue
git commit -m "feat(api): add BullMQ queue module for the parse queue"
```

---

### Task 8: Ingestion orchestrator

**Files:**
- Create: `apps/api/src/ingestion/ingestion.service.ts`
- Create: `apps/api/src/ingestion/ingestion.service.spec.ts`
- Create: `apps/api/src/ingestion/ingestion.module.ts`

**Interfaces:**
- Consumes: `PrismaService` (Task 4); `RawStorageService` (Task 5); `UkFindATenderAdapter` (Task 6); `PARSE_QUEUE` (Task 7).
- Produces: `IngestionService.runSource(sourceConfigId: string): Promise<{ sourceRunId: string; itemsFetched: number }>` — creates a `SourceRun`, iterates the adapter, writes each raw payload to storage then a `RawRecord` row, and enqueues one `ParseRawRecordJob` per raw record.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/ingestion/ingestion.service.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import * as fs from "node:fs";
import * as path from "node:path";
import nock from "nock";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageService } from "../raw-storage/raw-storage.service";
import { QueueModule } from "../queue/queue.module";
import { PARSE_QUEUE } from "../queue/queue.constants";
import { IngestionService } from "./ingestion.service";
import { validateEnv } from "../config/env.validation";
import type { Queue } from "bullmq";

const FIXTURES = path.join(__dirname, "../../test/fixtures");
const HOST = "https://www.find-tender.service.gov.uk";
const PATH = "/api/1.0/ocdsReleasePackages";

describe("IngestionService", () => {
  let prisma: PrismaService;
  let queue: Queue;
  let service: IngestionService;
  let sourceConfigId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), QueueModule],
      providers: [PrismaService, RawStorageService, IngestionService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();

    const rawStorage = moduleRef.get(RawStorageService);
    await rawStorage.onModuleInit();

    queue = moduleRef.get(PARSE_QUEUE);
    service = moduleRef.get(IngestionService);

    const source = await prisma.sourceRegistry.upsert({
      where: { id: "uk_find_a_tender" },
      update: {},
      create: {
        id: "uk_find_a_tender",
        name: "UK Find a Tender",
        countryCode: "GB",
        accessMethod: "api",
        policyStatus: "approved",
        adapterKey: "uk-find-a-tender-v1",
      },
    });
    const config = await prisma.sourceConfig.create({
      data: { sourceId: source.id, environment: "test", enabled: true },
    });
    sourceConfigId = config.id;
  });

  afterAll(async () => {
    await queue.close();
    await prisma.onModuleDestroy();
  });

  it("creates a source run, raw records, and enqueues parse jobs", async () => {
    const page1 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8"));
    const page2 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page2.json"), "utf-8"));
    nock(HOST).get(PATH).reply(200, page1);
    nock(HOST).get(PATH).query({ cursor: "page2" }).reply(200, page2);

    const result = await service.runSource(sourceConfigId);

    expect(result.itemsFetched).toBe(2);

    const rawRecords = await prisma.rawRecord.findMany({ where: { sourceRunId: result.sourceRunId } });
    expect(rawRecords).toHaveLength(2);

    const jobCounts = await queue.getJobCounts("waiting");
    expect(jobCounts.waiting).toBeGreaterThanOrEqual(2);
  });
});
```

This test needs Postgres, Redis, and MinIO reachable — start them first:
`docker compose up -d postgres redis minio`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ingestion.service`
Expected: FAIL — `./ingestion.service` doesn't exist.

- [ ] **Step 3: Implement `src/ingestion/ingestion.service.ts`**

```ts
import { Inject, Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageService } from "../raw-storage/raw-storage.service";
import { PARSE_QUEUE, type ParseRawRecordJob } from "../queue/queue.constants";
import { UkFindATenderAdapter } from "../adapters/uk-find-a-tender.adapter";
import type { SourceAdapter } from "../adapters/source-adapter.interface";

const ADAPTERS: Record<string, () => SourceAdapter> = {
  uk_find_a_tender: () => new UkFindATenderAdapter(),
};

@Injectable()
export class IngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rawStorage: RawStorageService,
    @Inject(PARSE_QUEUE) private readonly parseQueue: Queue<ParseRawRecordJob>,
  ) {}

  async runSource(sourceConfigId: string): Promise<{ sourceRunId: string; itemsFetched: number }> {
    const config = await this.prisma.sourceConfig.findUniqueOrThrow({
      where: { id: sourceConfigId },
    });

    const adapterFactory = ADAPTERS[config.sourceId];
    if (!adapterFactory) {
      throw new Error(`No adapter registered for source: ${config.sourceId}`);
    }
    const adapter = adapterFactory();

    const sourceRun = await this.prisma.sourceRun.create({
      data: { sourceConfigId, status: "RUNNING" },
    });

    let itemsFetched = 0;

    for await (const record of adapter.discover()) {
      const content = Buffer.from(JSON.stringify(record.lightweightPayload));
      const payloadHash = createHash("sha256").update(content).digest("hex");
      const key = `${config.sourceId}/${sourceRun.id}/${record.externalId}.json`;

      await this.rawStorage.save(key, content);

      const rawRecord = await this.prisma.rawRecord.create({
        data: {
          sourceRunId: sourceRun.id,
          externalId: record.externalId,
          payloadUri: key,
          payloadHash,
        },
      });

      await this.parseQueue.add("parse", { rawRecordId: rawRecord.id });
      itemsFetched += 1;
    }

    await this.prisma.sourceRun.update({
      where: { id: sourceRun.id },
      data: { status: "SUCCEEDED", itemsFetched, finishedAt: new Date() },
    });

    return { sourceRunId: sourceRun.id, itemsFetched };
  }
}
```

- [ ] **Step 4: Implement `src/ingestion/ingestion.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageModule } from "../raw-storage/raw-storage.module";
import { IngestionService } from "./ingestion.service";

@Module({
  imports: [RawStorageModule],
  providers: [PrismaService, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- ingestion.service`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/ingestion
git commit -m "feat(api): add ingestion orchestrator wiring adapter, storage, and queue"
```

---

### Task 9: Parser (raw OCDS release → flat fields)

**Files:**
- Create: `apps/api/src/parsing/uk-find-a-tender.parser.ts`
- Create: `apps/api/src/parsing/uk-find-a-tender.parser.spec.ts`

**Interfaces:**
- Produces: `parseUkFindATenderRelease(release: unknown): ParsedTenderFields` (`src/parsing/uk-find-a-tender.parser.ts`), where `ParsedTenderFields` has: `sourceExternalId`, `title`, `description`, `buyerName`, `countryName`, `publishedAtRaw`, `deadlineAtRaw`, `budgetAmount`, `currencyRaw`, `cpvCodes: string[]`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/parsing/uk-find-a-tender.parser.spec.ts`:

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import { parseUkFindATenderRelease } from "./uk-find-a-tender.parser";

const FIXTURES = path.join(__dirname, "../../test/fixtures");

describe("parseUkFindATenderRelease", () => {
  it("extracts expected fields from a release", () => {
    const page = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8"));
    const release = page.releases[0];

    const parsed = parseUkFindATenderRelease(release);

    expect(parsed).toEqual({
      sourceExternalId: "notice-1",
      title: "Case management software",
      description: "Supply of a case management platform.",
      buyerName: "Example Council",
      countryName: "United Kingdom",
      publishedAtRaw: "2026-09-01T00:00:00Z",
      deadlineAtRaw: "2026-09-30T23:59:59Z",
      budgetAmount: 100000,
      currencyRaw: "GBP",
      cpvCodes: ["72000000"],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- uk-find-a-tender.parser`
Expected: FAIL — `./uk-find-a-tender.parser` doesn't exist.

- [ ] **Step 3: Implement `src/parsing/uk-find-a-tender.parser.ts`**

```ts
export interface ParsedTenderFields {
  sourceExternalId: string;
  title: string;
  description: string | null;
  buyerName: string;
  countryName: string | null;
  publishedAtRaw: string;
  deadlineAtRaw: string | null;
  budgetAmount: number | null;
  currencyRaw: string | null;
  cpvCodes: string[];
}

interface OcdsRelease {
  date?: string;
  tender?: {
    id?: string;
    title?: string;
    description?: string;
    value?: { amount?: number; currency?: string };
    tenderPeriod?: { endDate?: string };
    items?: Array<{ classification?: { scheme?: string; id?: string } }>;
  };
  buyer?: { name?: string };
  parties?: Array<{ roles?: string[]; address?: { countryName?: string } }>;
}

export function parseUkFindATenderRelease(release: unknown): ParsedTenderFields {
  const r = release as OcdsRelease;
  const tender = r.tender ?? {};
  const buyerParty = (r.parties ?? []).find((p) => p.roles?.includes("buyer"));

  const cpvCodes = (tender.items ?? [])
    .filter((item) => item.classification?.scheme === "CPV" && item.classification.id)
    .map((item) => item.classification!.id as string);

  return {
    sourceExternalId: tender.id ?? "",
    title: tender.title ?? "",
    description: tender.description ?? null,
    buyerName: r.buyer?.name ?? "",
    countryName: buyerParty?.address?.countryName ?? null,
    publishedAtRaw: r.date ?? "",
    deadlineAtRaw: tender.tenderPeriod?.endDate ?? null,
    budgetAmount: tender.value?.amount ?? null,
    currencyRaw: tender.value?.currency ?? null,
    cpvCodes,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- uk-find-a-tender.parser`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/parsing
git commit -m "feat(api): parse UK Find a Tender OCDS releases into flat fields"
```

---

### Task 10: Tender processor (normalize, version, notice, outbox — one transaction)

**Files:**
- Create: `apps/api/src/tender-processing/tender-processor.service.ts`
- Create: `apps/api/src/tender-processing/tender-processor.service.spec.ts`
- Create: `apps/api/src/tender-processing/country-codes.ts`

**Interfaces:**
- Consumes: `ParsedTenderFields` (Task 9); `PrismaService` (Task 4).
- Produces: `TenderProcessorService.process(input: { sourceId: string; rawRecordId: string; sourceUrl: string; parsed: ParsedTenderFields }): Promise<{ tenderId: string; versionId: string; created: boolean }>` — resolves the tender via `tender_notices`, computes `content_hash`, writes a new `tender_version` only on material change, and writes an `outbox_events` row in the same transaction when a version is created.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/tender-processing/tender-processor.service.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { TenderProcessorService } from "./tender-processor.service";
import { validateEnv } from "../config/env.validation";

describe("TenderProcessorService", () => {
  let prisma: PrismaService;
  let service: TenderProcessorService;
  let rawRecordId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      providers: [PrismaService, TenderProcessorService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
    service = moduleRef.get(TenderProcessorService);

    const source = await prisma.sourceRegistry.upsert({
      where: { id: "uk_find_a_tender" },
      update: {},
      create: {
        id: "uk_find_a_tender",
        name: "UK Find a Tender",
        countryCode: "GB",
        accessMethod: "api",
        policyStatus: "approved",
        adapterKey: "uk-find-a-tender-v1",
      },
    });
    const config = await prisma.sourceConfig.create({
      data: { sourceId: source.id, environment: "test", enabled: true },
    });
    const run = await prisma.sourceRun.create({
      data: { sourceConfigId: config.id, status: "RUNNING" },
    });
    const rawRecord = await prisma.rawRecord.create({
      data: {
        sourceRunId: run.id,
        externalId: "notice-processor-1",
        payloadUri: "uk_find_a_tender/test/notice-processor-1.json",
        payloadHash: "hash-1",
      },
    });
    rawRecordId = rawRecord.id;
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  const baseParsed = {
    sourceExternalId: "notice-processor-1",
    title: "Case management software",
    description: "Supply of a case management platform.",
    buyerName: "Example Council",
    countryName: "United Kingdom",
    publishedAtRaw: "2026-09-01T00:00:00Z",
    deadlineAtRaw: "2026-09-30T23:59:59Z",
    budgetAmount: 100000,
    currencyRaw: "GBP",
    cpvCodes: ["72000000"],
  };

  it("creates a tender, notice, version, and outbox event on first sight", async () => {
    const result = await service.process({
      sourceId: "uk_find_a_tender",
      rawRecordId,
      sourceUrl: "https://www.find-tender.service.gov.uk/notice/notice-processor-1",
      parsed: baseParsed,
    });

    expect(result.created).toBe(true);

    const notice = await prisma.tenderNotice.findUnique({
      where: {
        tender_notices_source_external_uq: { sourceId: "uk_find_a_tender", sourceExternalId: "notice-processor-1" },
      },
    });
    expect(notice?.tenderId).toBe(result.tenderId);

    const outboxEvents = await prisma.outboxEvent.findMany({
      where: { aggregateId: result.tenderId, eventType: "tender.version.published" },
    });
    expect(outboxEvents).toHaveLength(1);
  });

  it("does not create a new version when content is unchanged", async () => {
    const first = await service.process({
      sourceId: "uk_find_a_tender",
      rawRecordId,
      sourceUrl: "https://www.find-tender.service.gov.uk/notice/notice-processor-1",
      parsed: baseParsed,
    });

    const second = await service.process({
      sourceId: "uk_find_a_tender",
      rawRecordId,
      sourceUrl: "https://www.find-tender.service.gov.uk/notice/notice-processor-1",
      parsed: baseParsed,
    });

    expect(second.tenderId).toBe(first.tenderId);
    expect(second.versionId).toBe(first.versionId);
    expect(second.created).toBe(false);
  });
});
```

This test needs Postgres reachable — start it first: `docker compose up -d postgres`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tender-processor`
Expected: FAIL — `./tender-processor.service` doesn't exist.

- [ ] **Step 3: Implement `src/tender-processing/country-codes.ts`**

```ts
const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  "united kingdom": "GB",
  ireland: "IE",
  france: "FR",
  germany: "DE",
};

export function toIso2(countryName: string | null): string | null {
  if (!countryName) return null;
  return COUNTRY_NAME_TO_ISO2[countryName.trim().toLowerCase()] ?? null;
}
```

- [ ] **Step 4: Implement `src/tender-processing/tender-processor.service.ts`**

```ts
import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { ParsedTenderFields } from "../parsing/uk-find-a-tender.parser";
import { toIso2 } from "./country-codes";

interface ProcessInput {
  sourceId: string;
  rawRecordId: string;
  sourceUrl: string;
  parsed: ParsedTenderFields;
}

interface ProcessResult {
  tenderId: string;
  versionId: string;
  created: boolean;
}

@Injectable()
export class TenderProcessorService {
  constructor(private readonly prisma: PrismaService) {}

  async process(input: ProcessInput): Promise<ProcessResult> {
    const { sourceId, parsed } = input;
    const countryCode = toIso2(parsed.countryName);

    const canonicalTender = {
      title: parsed.title,
      description: parsed.description,
      buyer: { name: parsed.buyerName, countryCode },
      publishedAt: parsed.publishedAtRaw,
      deadlineAt: parsed.deadlineAtRaw,
      value: { amount: parsed.budgetAmount, currency: parsed.currencyRaw },
      cpvCodes: parsed.cpvCodes,
    };
    const contentHash = createHash("sha256").update(JSON.stringify(canonicalTender)).digest("hex");

    return this.prisma.$transaction(async (tx) => {
      const existingNotice = await tx.tenderNotice.findUnique({
        where: {
          tender_notices_source_external_uq: { sourceId, sourceExternalId: parsed.sourceExternalId },
        },
      });

      let tenderId: string;

      if (existingNotice) {
        tenderId = existingNotice.tenderId;
      } else {
        const tender = await tx.tender.create({
          data: { canonicalKey: `${sourceId}:${parsed.sourceExternalId}`, sourceId },
        });
        tenderId = tender.id;

        await tx.tenderNotice.create({
          data: {
            tenderId,
            sourceId,
            sourceExternalId: parsed.sourceExternalId,
            sourceUrl: input.sourceUrl,
            rawRecordId: input.rawRecordId,
          },
        });
      }

      const existingVersion = await tx.tenderVersion.findUnique({
        where: { tender_versions_tender_hash_uq: { tenderId, contentHash } },
      });

      if (existingVersion) {
        return { tenderId, versionId: existingVersion.id, created: false };
      }

      const version = await tx.tenderVersion.create({
        data: {
          tenderId,
          contentHash,
          normalizedJson: canonicalTender,
          publishedAt: new Date(parsed.publishedAtRaw),
          deadlineAt: parsed.deadlineAtRaw ? new Date(parsed.deadlineAtRaw) : null,
        },
      });

      await tx.tender.update({ where: { id: tenderId }, data: { currentVersionId: version.id } });

      await tx.outboxEvent.create({
        data: {
          id: randomUUID(),
          eventType: "tender.version.published",
          aggregateType: "tender",
          aggregateId: tenderId,
          payloadJson: { tenderId, versionId: version.id },
        },
      });

      return { tenderId, versionId: version.id, created: true };
    });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- tender-processor`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/tender-processing
git commit -m "feat(api): add tender processor with versioning and transactional outbox"
```

---

### Task 11: BullMQ parse queue consumer

**Files:**
- Create: `apps/api/src/parsing/parse-raw-record.processor.ts`
- Create: `apps/api/src/parsing/parse-raw-record.processor.spec.ts`
- Create: `apps/api/src/parsing/parsing.module.ts`

**Interfaces:**
- Consumes: `ParseRawRecordJob` (Task 7); `RawStorageService` (Task 5); `PrismaService` (Task 4); `parseUkFindATenderRelease` (Task 9); `TenderProcessorService` (Task 10).
- Produces: `ParseRawRecordProcessor` — a BullMQ `Worker` (wrapped as a Nest injectable with an explicit `process(job)` method used both by the real worker and directly by tests) that loads the `RawRecord`, loads its payload from storage, parses it, and calls `TenderProcessorService.process`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/parsing/parse-raw-record.processor.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageService } from "../raw-storage/raw-storage.service";
import { TenderProcessorService } from "../tender-processing/tender-processor.service";
import { ParseRawRecordProcessor } from "./parse-raw-record.processor";
import { validateEnv } from "../config/env.validation";
import * as fs from "node:fs";
import * as path from "node:path";

const FIXTURES = path.join(__dirname, "../../test/fixtures");

describe("ParseRawRecordProcessor", () => {
  let prisma: PrismaService;
  let rawStorage: RawStorageService;
  let processor: ParseRawRecordProcessor;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      providers: [PrismaService, RawStorageService, TenderProcessorService, ParseRawRecordProcessor],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
    rawStorage = moduleRef.get(RawStorageService);
    await rawStorage.onModuleInit();
    processor = moduleRef.get(ParseRawRecordProcessor);
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("processes a raw record end to end into a tender version", async () => {
    const source = await prisma.sourceRegistry.upsert({
      where: { id: "uk_find_a_tender" },
      update: {},
      create: {
        id: "uk_find_a_tender",
        name: "UK Find a Tender",
        countryCode: "GB",
        accessMethod: "api",
        policyStatus: "approved",
        adapterKey: "uk-find-a-tender-v1",
      },
    });
    const config = await prisma.sourceConfig.create({
      data: { sourceId: source.id, environment: "test", enabled: true },
    });
    const run = await prisma.sourceRun.create({ data: { sourceConfigId: config.id, status: "RUNNING" } });

    const release = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8")).releases[0];
    const key = `uk_find_a_tender/${run.id}/notice-1.json`;
    await rawStorage.save(key, Buffer.from(JSON.stringify(release)));

    const rawRecord = await prisma.rawRecord.create({
      data: { sourceRunId: run.id, externalId: "notice-1", payloadUri: key, payloadHash: "hash-x" },
    });

    await processor.process({ data: { rawRecordId: rawRecord.id } } as never);

    const notice = await prisma.tenderNotice.findUnique({
      where: { tender_notices_source_external_uq: { sourceId: "uk_find_a_tender", sourceExternalId: "notice-1" } },
    });
    expect(notice).not.toBeNull();

    const version = await prisma.tenderVersion.findFirst({ where: { tenderId: notice!.tenderId } });
    expect(version?.normalizedJson).toMatchObject({ title: "Case management software" });
  });
});
```

This test needs Postgres and MinIO reachable — start them first:
`docker compose up -d postgres minio`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- parse-raw-record.processor`
Expected: FAIL — `./parse-raw-record.processor` doesn't exist.

- [ ] **Step 3: Implement `src/parsing/parse-raw-record.processor.ts`**

```ts
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker, type Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageService } from "../raw-storage/raw-storage.service";
import { TenderProcessorService } from "../tender-processing/tender-processor.service";
import { parseUkFindATenderRelease } from "./uk-find-a-tender.parser";
import { PARSE_QUEUE_NAME, type ParseRawRecordJob } from "../queue/queue.constants";
import type { AppEnv } from "../config/env.validation";

@Injectable()
export class ParseRawRecordProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<ParseRawRecordJob>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rawStorage: RawStorageService,
    private readonly tenderProcessor: TenderProcessorService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  onModuleInit() {
    this.worker = new Worker<ParseRawRecordJob>(
      PARSE_QUEUE_NAME,
      (job) => this.process(job),
      { connection: { url: this.config.get("REDIS_URL", { infer: true }) } as never },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  async process(job: Job<ParseRawRecordJob>): Promise<void> {
    const rawRecord = await this.prisma.rawRecord.findUniqueOrThrow({
      where: { id: job.data.rawRecordId },
      include: { sourceRun: { include: { sourceConfig: true } } },
    });

    const content = await this.rawStorage.load(rawRecord.payloadUri);
    const release = JSON.parse(content.toString("utf-8"));
    const parsed = parseUkFindATenderRelease(release);

    await this.tenderProcessor.process({
      sourceId: rawRecord.sourceRun.sourceConfig.sourceId,
      rawRecordId: rawRecord.id,
      sourceUrl: `https://www.find-tender.service.gov.uk/notice/${parsed.sourceExternalId}`,
      parsed,
    });
  }
}
```

- [ ] **Step 4: Implement `src/parsing/parsing.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageModule } from "../raw-storage/raw-storage.module";
import { TenderProcessorService } from "../tender-processing/tender-processor.service";
import { ParseRawRecordProcessor } from "./parse-raw-record.processor";

@Module({
  imports: [RawStorageModule],
  providers: [PrismaService, TenderProcessorService, ParseRawRecordProcessor],
  exports: [ParseRawRecordProcessor],
})
export class ParsingModule {}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- parse-raw-record.processor`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/parsing/parse-raw-record.processor.ts apps/api/src/parsing/parse-raw-record.processor.spec.ts apps/api/src/parsing/parsing.module.ts
git commit -m "feat(api): add BullMQ worker consuming parse jobs into tender versions"
```

---

### Task 12: Outbox relay

**Files:**
- Create: `apps/api/src/outbox/outbox-relay.service.ts`
- Create: `apps/api/src/outbox/outbox-relay.service.spec.ts`
- Create: `apps/api/src/outbox/outbox.module.ts`

**Interfaces:**
- Consumes: `PrismaService` (Task 4).
- Produces: `OutboxRelayService.relayOnce(): Promise<number>` — finds all `OutboxEvent` rows with `publishedAt: null`, logs each, marks it published, and returns the count relayed.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/outbox/outbox-relay.service.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxRelayService } from "./outbox-relay.service";
import { validateEnv } from "../config/env.validation";

describe("OutboxRelayService", () => {
  let prisma: PrismaService;
  let service: OutboxRelayService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      providers: [PrismaService, OutboxRelayService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
    service = moduleRef.get(OutboxRelayService);
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("marks unpublished outbox events as published", async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        eventType: "tender.version.published",
        aggregateType: "tender",
        aggregateId: "ten_relay_test",
        payloadJson: { tenderId: "ten_relay_test" },
      },
    });

    const relayedCount = await service.relayOnce();
    expect(relayedCount).toBeGreaterThanOrEqual(1);

    const reloaded = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: event.id } });
    expect(reloaded.publishedAt).not.toBeNull();
  });
});
```

This test needs Postgres reachable — start it first: `docker compose up -d postgres`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- outbox-relay`
Expected: FAIL — `./outbox-relay.service` doesn't exist.

- [ ] **Step 3: Implement `src/outbox/outbox-relay.service.ts`**

```ts
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(private readonly prisma: PrismaService) {}

  async relayOnce(): Promise<number> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    for (const event of events) {
      this.logger.log(`relaying ${event.eventType} for ${event.aggregateType}:${event.aggregateId}`);
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { publishedAt: new Date() },
      });
    }

    return events.length;
  }
}
```

- [ ] **Step 4: Implement `src/outbox/outbox.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxRelayService } from "./outbox-relay.service";

@Module({
  providers: [PrismaService, OutboxRelayService],
  exports: [OutboxRelayService],
})
export class OutboxModule {}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- outbox-relay`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/outbox
git commit -m "feat(api): add outbox relay marking events published"
```

---

### Task 13: `GET /v1/tenders` API endpoint

**Files:**
- Create: `apps/api/src/tenders/cursor.util.ts`
- Create: `apps/api/src/tenders/cursor.util.spec.ts`
- Create: `apps/api/src/tenders/tenders.controller.ts`
- Create: `apps/api/src/tenders/tenders.controller.spec.ts`
- Create: `apps/api/src/tenders/tenders.module.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService` (Task 4).
- Produces: `encodeCursor(id: string): string`, `decodeCursor(cursor: string): string` (`src/tenders/cursor.util.ts`); `GET /v1/tenders?limit=&cursor=` returning `{ data, page: { nextCursor, hasMore }, meta: { requestId } }` per spec §13.

- [ ] **Step 1: Write the failing test for the cursor util**

Create `apps/api/src/tenders/cursor.util.spec.ts`:

```ts
import { decodeCursor, encodeCursor } from "./cursor.util";

describe("cursor util", () => {
  it("round-trips an id through encode/decode", () => {
    const cursor = encodeCursor("ten_abc123");
    expect(decodeCursor(cursor)).toBe("ten_abc123");
  });

  it("produces an opaque, non-plaintext string", () => {
    const cursor = encodeCursor("ten_abc123");
    expect(cursor).not.toContain("ten_abc123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- cursor.util`
Expected: FAIL — `./cursor.util` doesn't exist.

- [ ] **Step 3: Implement `src/tenders/cursor.util.ts`**

```ts
export function encodeCursor(id: string): string {
  return Buffer.from(id, "utf-8").toString("base64url");
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf-8");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- cursor.util`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the controller**

Create `apps/api/src/tenders/tenders.controller.spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { TendersController } from "./tenders.controller";
import { validateEnv } from "../config/env.validation";

describe("TendersController", () => {
  let prisma: PrismaService;
  let controller: TendersController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      controllers: [TendersController],
      providers: [PrismaService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
    controller = moduleRef.get(TendersController);
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("lists tenders with their current version data", async () => {
    const source = await prisma.sourceRegistry.upsert({
      where: { id: "uk_find_a_tender" },
      update: {},
      create: {
        id: "uk_find_a_tender",
        name: "UK Find a Tender",
        countryCode: "GB",
        accessMethod: "api",
        policyStatus: "approved",
        adapterKey: "uk-find-a-tender-v1",
      },
    });
    const tender = await prisma.tender.create({
      data: { canonicalKey: `uk_find_a_tender:notice-list-1`, sourceId: source.id },
    });
    const version = await prisma.tenderVersion.create({
      data: {
        tenderId: tender.id,
        contentHash: "hash-list-1",
        normalizedJson: { title: "List test tender", buyer: { name: "X Council", countryCode: "GB" } },
        publishedAt: new Date("2026-09-01T00:00:00Z"),
      },
    });
    await prisma.tender.update({ where: { id: tender.id }, data: { currentVersionId: version.id } });

    const response = await controller.list({ limit: 25 });

    expect(response.data.some((t) => t.id === tender.id)).toBe(true);
    expect(response.meta.requestId).toBeDefined();
    expect(response.page).toHaveProperty("hasMore");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm test -- tenders.controller`
Expected: FAIL — `./tenders.controller` doesn't exist.

- [ ] **Step 7: Implement `src/tenders/tenders.controller.ts`**

```ts
import { Controller, Get, Query } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { decodeCursor, encodeCursor } from "./cursor.util";

interface TenderListItem {
  id: string;
  title: string;
  buyerName: string;
  countryCode: string | null;
  publishedAt: string;
  deadlineAt: string | null;
}

interface TenderListResponse {
  data: TenderListItem[];
  page: { nextCursor: string | null; hasMore: boolean };
  meta: { requestId: string };
}

@Controller("v1/tenders")
export class TendersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: { limit?: number; cursor?: string }): Promise<TenderListResponse> {
    const limit = Math.min(Number(query.limit) || 25, 100);
    const cursorId = query.cursor ? decodeCursor(query.cursor) : undefined;

    const tenders = await this.prisma.tender.findMany({
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      orderBy: { id: "asc" },
    });

    const hasMore = tenders.length > limit;
    const page = tenders.slice(0, limit);

    const versionIds = page.map((t) => t.currentVersionId).filter((v): v is string => !!v);
    const versions = await this.prisma.tenderVersion.findMany({ where: { id: { in: versionIds } } });
    const versionById = new Map(versions.map((v) => [v.id, v]));

    const data: TenderListItem[] = page.map((tender) => {
      const version = tender.currentVersionId ? versionById.get(tender.currentVersionId) : undefined;
      const normalized = (version?.normalizedJson ?? {}) as {
        title?: string;
        buyer?: { name?: string; countryCode?: string | null };
      };
      return {
        id: tender.id,
        title: normalized.title ?? "",
        buyerName: normalized.buyer?.name ?? "",
        countryCode: normalized.buyer?.countryCode ?? null,
        publishedAt: version?.publishedAt.toISOString() ?? "",
        deadlineAt: version?.deadlineAt?.toISOString() ?? null,
      };
    });

    return {
      data,
      page: {
        nextCursor: hasMore ? encodeCursor(page[page.length - 1].id) : null,
        hasMore,
      },
      meta: { requestId: `req_${randomUUID()}` },
    };
  }
}
```

- [ ] **Step 8: Implement `src/tenders/tenders.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TendersController } from "./tenders.controller";

@Module({
  controllers: [TendersController],
  providers: [PrismaService],
})
export class TendersModule {}
```

- [ ] **Step 9: Wire `TendersModule` into `src/app.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { TendersModule } from "./tenders/tenders.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), TendersModule],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 10: Run test to verify it passes**

Run: `pnpm test -- tenders.controller`
Expected: PASS.

- [ ] **Step 11: Run the full backend test suite**

Run: `docker compose up -d postgres redis minio && pnpm test`
Expected: all tests from Tasks 3-13 PASS.

- [ ] **Step 12: Commit**

```bash
git add apps/api/src/tenders apps/api/src/app.module.ts
git commit -m "feat(api): add GET /v1/tenders with cursor pagination"
```

---

### Task 14: Frontend scaffold with tender list page

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
- Produces: `TenderListItem` interface and `fetchTenders(): Promise<TenderListItem[]>` (`apps/web/lib/api.ts`, unwrapping the `{ data, page, meta }` envelope); `TenderTable` component.

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
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

Create `apps/web/vitest.config.ts`:

```ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

Create `apps/web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing test**

Create `apps/web/lib/api.ts` (types only for now, so the test file type-checks):

```ts
export interface TenderListItem {
  id: string;
  title: string;
  buyerName: string;
  countryCode: string | null;
  publishedAt: string;
  deadlineAt: string | null;
}
```

Create `apps/web/components/TenderTable.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TenderListItem } from "@/lib/api";
import { TenderTable } from "./TenderTable";

const sampleTender: TenderListItem = {
  id: "ten_abc123",
  title: "Case management software",
  buyerName: "Example Council",
  countryCode: "GB",
  publishedAt: "2026-09-01T00:00:00Z",
  deadlineAt: "2026-09-30T23:59:59Z",
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
        </tr>
      </thead>
      <tbody>
        {tenders.map((tender) => (
          <tr key={tender.id} className="border-b">
            <td className="py-2 pr-4">{tender.title}</td>
            <td className="py-2 pr-4">{tender.buyerName}</td>
            <td className="py-2 pr-4">{tender.countryCode ?? "—"}</td>
            <td className="py-2 pr-4">
              {tender.deadlineAt ? new Date(tender.deadlineAt).toLocaleDateString() : "—"}
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
interface TenderListEnvelope {
  data: TenderListItem[];
  page: { nextCursor: string | null; hasMore: boolean };
  meta: { requestId: string };
}

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

export async function fetchTenders(): Promise<TenderListItem[]> {
  const response = await fetch(`${API_BASE_URL}/v1/tenders`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch tenders: ${response.status}`);
  }

  const envelope = (await response.json()) as TenderListEnvelope;
  return envelope.data;
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

export const metadata = { title: "Tender Intelligence" };

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

### Task 15: Worker entrypoint, full Docker Compose wiring, and README

**Files:**
- Create: `apps/api/src/worker.ts`
- Create: `apps/api/src/worker.module.ts`
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: `IngestionModule`, `ParsingModule`, `OutboxModule` (Tasks 8, 11, 12).
- Produces: a standalone worker process (`node dist/worker.js`) that starts the BullMQ consumer and polls the outbox relay every 5 seconds; a runnable `docker compose up --build` stack.

- [ ] **Step 1: Implement `src/worker.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ParsingModule } from "./parsing/parsing.module";
import { OutboxModule } from "./outbox/outbox.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), ParsingModule, OutboxModule],
})
export class WorkerModule {}
```

- [ ] **Step 2: Implement `src/worker.ts`**

```ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { WorkerModule } from "./worker.module";
import { OutboxRelayService } from "./outbox/outbox-relay.service";

const OUTBOX_POLL_INTERVAL_MS = 5000;

async function bootstrap() {
  const logger = new Logger("Worker");
  const app = await NestFactory.createApplicationContext(WorkerModule);

  const outboxRelay = app.get(OutboxRelayService);
  setInterval(() => {
    outboxRelay.relayOnce().catch((error) => logger.error("outbox relay failed", error));
  }, OUTBOX_POLL_INTERVAL_MS);

  logger.log("worker started: parse consumer active, outbox relay polling every 5s");
}

bootstrap();
```

Add a `worker` script to `apps/api/package.json` `scripts`:

```json
"start:worker": "ts-node -r tsconfig-paths/register src/worker.ts"
```

- [ ] **Step 3: Verify the worker boots**

```bash
cd apps/api
docker compose up -d postgres redis minio
pnpm run start:worker &
sleep 3
kill %1
```

Expected: log line `worker started: parse consumer active, outbox relay polling every 5s` with no errors, then the process is killed cleanly.

- [ ] **Step 4: Create `apps/api/Dockerfile`**

```dockerfile
FROM node:20-slim

WORKDIR /repo

COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @tender-intel/api prisma:generate
RUN pnpm --filter @tender-intel/api build

WORKDIR /repo/apps/api
CMD ["node", "dist/main.js"]
```

- [ ] **Step 5: Create `apps/web/Dockerfile`**

```dockerfile
FROM node:20-slim

WORKDIR /repo

COPY . .
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @tender-intel/web build

WORKDIR /repo/apps/web
CMD ["pnpm", "start"]
```

- [ ] **Step 6: Update `docker-compose.yml`** to add `api`, `worker`, `web` services alongside `postgres`, `redis`, `minio`:

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

  minio:
    image: minio/minio:RELEASE.2024-10-13T13-34-11Z
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: tender
      MINIO_ROOT_PASSWORD: tender12345
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://tender:tender@postgres:5432/tender_intel
      REDIS_URL: redis://redis:6379
      OBJECT_STORAGE_ENDPOINT: minio
      OBJECT_STORAGE_PORT: "9000"
      OBJECT_STORAGE_USE_SSL: "false"
      OBJECT_STORAGE_ACCESS_KEY: tender
      OBJECT_STORAGE_SECRET_KEY: tender12345
      OBJECT_STORAGE_BUCKET: raw-records
      APP_BASE_URL: http://localhost:3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
      - minio

  worker:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    command: ["node", "dist/worker.js"]
    environment:
      DATABASE_URL: postgresql://tender:tender@postgres:5432/tender_intel
      REDIS_URL: redis://redis:6379
      OBJECT_STORAGE_ENDPOINT: minio
      OBJECT_STORAGE_PORT: "9000"
      OBJECT_STORAGE_USE_SSL: "false"
      OBJECT_STORAGE_ACCESS_KEY: tender
      OBJECT_STORAGE_SECRET_KEY: tender12345
      OBJECT_STORAGE_BUCKET: raw-records
      APP_BASE_URL: http://localhost:3001
    depends_on:
      - postgres
      - redis
      - minio

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      API_BASE_URL: http://api:3001
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
  minio_data:
```

- [ ] **Step 7: Verify the compose file**

Run: `docker compose config`
Expected: resolved config includes `postgres`, `redis`, `minio`, `api`, `worker`, `web` with no errors.

- [ ] **Step 8: Write the full `README.md`**

```markdown
# Tender Intelligence

AI-assisted procurement/tender discovery platform. See
`docs/superpowers/specs/2026-09-04-tender-intelligence-scaffold-v2-design.md`
for the scaffold design.

## Structure

- `apps/api` — NestJS API + BullMQ worker (ingestion, parsing, versioning, outbox, REST API)
- `apps/web` — Next.js frontend
- `packages/schema` — shared canonical tender schema (JSON Schema + TS types)

## Local development

### Prerequisites

Docker + Docker Compose, Node.js 20+, pnpm.

### Run everything with Docker Compose

\`\`\`bash
docker compose up --build
\`\`\`

- API: http://localhost:3001
- Web: http://localhost:3000
- MinIO console: http://localhost:9001 (tender / tender12345)

Run migrations once against the running Postgres container:

\`\`\`bash
docker compose exec api npx prisma migrate deploy
\`\`\`

Seed one source config so ingestion has something to run:

\`\`\`bash
docker compose exec postgres psql -U tender -d tender_intel -c \
  "insert into source_registry (id, name, country_code, access_method, policy_status, adapter_key) values ('uk_find_a_tender', 'UK Find a Tender', 'GB', 'api', 'approved', 'uk-find-a-tender-v1');"
docker compose exec postgres psql -U tender -d tender_intel -c \
  "insert into source_configs (id, source_id, environment, enabled) values (gen_random_uuid(), 'uk_find_a_tender', 'production', true);"
\`\`\`

Trigger an ingestion run via the Nest CLI REPL, or add a small admin
endpoint in a later plan — this scaffold intentionally has no
scheduler/admin trigger yet (see the design doc's "Out of Scope").

### Run backend tests locally

\`\`\`bash
docker compose up -d postgres redis minio
cd apps/api
pnpm install
pnpm test
\`\`\`

### Run frontend locally

\`\`\`bash
pnpm install
pnpm --filter @tender-intel/web dev
\`\`\`

## What's implemented

One working end-to-end slice, event-driven per the technical spec:
UK Find a Tender → object storage → raw_records → queued parse job →
normalize/version/dedup-by-notice → transactional outbox → relay →
`GET /v1/tenders` → web table. Auth, matching, alerts, billing, and
every source beyond UK Find a Tender are out of scope — see the design
doc.
```

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/worker.ts apps/api/src/worker.module.ts apps/api/Dockerfile apps/web/Dockerfile docker-compose.yml README.md apps/api/package.json
git commit -m "feat: add worker entrypoint and wire full docker-compose stack"
```
