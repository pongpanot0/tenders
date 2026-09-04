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
