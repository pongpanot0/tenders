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
  let sourceConfigId: string | null = null;
  let sourceRunId: string | null = null;
  let rawRecordId: string | null = null;
  let tenderId: string | null = null;

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
    // Clean up test data in FK-safe order (child before parent) so re-running
    // this suite against the persisted dev DB does not fail on second run.
    if (tenderId) {
      await prisma.outboxEvent.deleteMany({ where: { aggregateId: tenderId } });
      await prisma.tenderVersion.deleteMany({ where: { tenderId } });
      await prisma.tenderNotice.deleteMany({ where: { tenderId } });
      await prisma.tender.delete({ where: { id: tenderId } });
    }

    if (rawRecordId) {
      await prisma.rawRecord.delete({ where: { id: rawRecordId } });
    }

    if (sourceRunId) {
      await prisma.sourceRun.delete({ where: { id: sourceRunId } });
    }

    if (sourceConfigId) {
      await prisma.sourceConfig.delete({ where: { id: sourceConfigId } });
    }

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
    sourceConfigId = config.id;
    const run = await prisma.sourceRun.create({ data: { sourceConfigId: config.id, status: "RUNNING" } });
    sourceRunId = run.id;

    const release = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8")).releases[0];
    const key = `uk_find_a_tender/${run.id}/notice-1.json`;
    await rawStorage.save(key, Buffer.from(JSON.stringify(release)));

    const rawRecord = await prisma.rawRecord.create({
      data: { sourceRunId: run.id, externalId: "notice-1", payloadUri: key, payloadHash: "hash-x" },
    });
    rawRecordId = rawRecord.id;

    await processor.process({ data: { rawRecordId: rawRecord.id } } as never);

    const notice = await prisma.tenderNotice.findUnique({
      where: { tender_notices_source_external_uq: { sourceId: "uk_find_a_tender", sourceExternalId: "notice-1" } },
    });
    expect(notice).not.toBeNull();
    tenderId = notice!.tenderId;

    const version = await prisma.tenderVersion.findFirst({ where: { tenderId: notice!.tenderId } });
    expect(version?.normalizedJson).toMatchObject({ title: "Case management software" });
  });
});
