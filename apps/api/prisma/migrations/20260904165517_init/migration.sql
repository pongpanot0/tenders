-- CreateTable
CREATE TABLE "source_registry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "access_method" TEXT NOT NULL,
    "policy_status" TEXT NOT NULL,
    "adapter_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_configs" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "schedule" TEXT,
    "query_json" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "source_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_runs" (
    "id" TEXT NOT NULL,
    "source_config_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cursor_before" TEXT,
    "cursor_after" TEXT,
    "items_fetched" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "source_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_records" (
    "id" TEXT NOT NULL,
    "source_run_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "payload_uri" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "canonical_key" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "current_version_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_versions" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "normalized_json" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "deadline_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_notices" (
    "id" TEXT NOT NULL,
    "tender_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_external_id" TEXT NOT NULL,
    "notice_type" TEXT,
    "source_url" TEXT NOT NULL,
    "raw_record_id" TEXT NOT NULL,

    CONSTRAINT "tender_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_records_source_run_id_external_id_payload_hash_key" ON "raw_records"("source_run_id", "external_id", "payload_hash");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_canonical_key_key" ON "tenders"("canonical_key");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_current_version_id_key" ON "tenders"("current_version_id");

-- CreateIndex
CREATE INDEX "tender_versions_deadline_open_idx" ON "tender_versions"("deadline_at");

-- CreateIndex
CREATE UNIQUE INDEX "tender_versions_tender_id_content_hash_key" ON "tender_versions"("tender_id", "content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "tender_notices_source_id_source_external_id_key" ON "tender_notices"("source_id", "source_external_id");

-- AddForeignKey
ALTER TABLE "source_configs" ADD CONSTRAINT "source_configs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source_registry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_runs" ADD CONSTRAINT "source_runs_source_config_id_fkey" FOREIGN KEY ("source_config_id") REFERENCES "source_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_source_run_id_fkey" FOREIGN KEY ("source_run_id") REFERENCES "source_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_versions" ADD CONSTRAINT "tender_versions_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_notices" ADD CONSTRAINT "tender_notices_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_notices" ADD CONSTRAINT "tender_notices_raw_record_id_fkey" FOREIGN KEY ("raw_record_id") REFERENCES "raw_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
