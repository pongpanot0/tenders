import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import nock from "nock";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageService } from "../raw-storage/raw-storage.service";
import { TenderProcessorService } from "../tender-processing/tender-processor.service";
import { ParseRawRecordProcessor } from "../parsing/parse-raw-record.processor";
import { QueueModule } from "../queue/queue.module";
import { PARSE_QUEUE } from "../queue/queue.constants";
import { IngestionService } from "../ingestion/ingestion.service";
import { TendersController } from "../tenders/tenders.controller";
import { validateEnv } from "../config/env.validation";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Queue } from "bullmq";

const FIXTURES = path.join(__dirname, "../../test/fixtures");

const HOST = "https://www.find-tender.service.gov.uk";
const PATH = "/api/1.0/ocdsReleasePackages";

// Full ingest -> parse -> process -> API chain: seeds a Source/SourceConfig
// exactly like ingestion.service.spec.ts, mocks the two-page HTTP fixture
// response with nock, runs IngestionService.runSource(), then drives each
// resulting RawRecord through ParseRawRecordProcessor.process() directly
// (no live BullMQ worker runs during tests, same pattern as
// parse-raw-record.processor.spec.ts), and finally asserts the ingested
// tenders come back out of TendersController.list().
describe("ingest -> parse -> process -> API integration", () => {
  let prisma: PrismaService;
  let rawStorage: RawStorageService;
  let queue: Queue;
  let ingestionService: IngestionService;
  let processor: ParseRawRecordProcessor;
  let tendersController: TendersController;

  let sourceConfigId: string | null = null;
  let sourceRunId: string | null = null;
  let tenderIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), QueueModule],
      controllers: [TendersController],
      providers: [PrismaService, RawStorageService, TenderProcessorService, ParseRawRecordProcessor, IngestionService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();

    rawStorage = moduleRef.get(RawStorageService);
    await rawStorage.onModuleInit();

    queue = moduleRef.get(PARSE_QUEUE);

    ingestionService = moduleRef.get(IngestionService);
    processor = moduleRef.get(ParseRawRecordProcessor);
    tendersController = moduleRef.get(TendersController);

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
      data: { sourceId: source.id, environment: "integration-test", enabled: true },
    });
    sourceConfigId = config.id;
  });

  afterAll(async () => {
    // Clean up test data in FK-safe order (child before parent), matching
    // the pattern in parse-raw-record.processor.spec.ts, so this suite can
    // be re-run against the persisted dev DB.
    for (const tenderId of tenderIds) {
      await prisma.outboxEvent.deleteMany({ where: { aggregateId: tenderId } });
      await prisma.tenderVersion.deleteMany({ where: { tenderId } });
      await prisma.tenderNotice.deleteMany({ where: { tenderId } });
      await prisma.tender.delete({ where: { id: tenderId } });
    }

    if (sourceRunId) {
      await prisma.rawRecord.deleteMany({ where: { sourceRunId } });
      await prisma.sourceRun.delete({ where: { id: sourceRunId } });
    }

    if (sourceConfigId) {
      await prisma.sourceConfig.delete({ where: { id: sourceConfigId } });
    }

    await queue.close();
    await prisma.onModuleDestroy();
  });

  it("ingests two releases and surfaces them via GET /v1/tenders", async () => {
    const page1 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page1.json"), "utf-8"));
    const page2 = JSON.parse(fs.readFileSync(path.join(FIXTURES, "uk-ftts-page2.json"), "utf-8"));
    nock(HOST).get(PATH).reply(200, page1);
    nock(HOST).get(PATH).query({ cursor: "page2" }).reply(200, page2);

    const runResult = await ingestionService.runSource(sourceConfigId!);
    sourceRunId = runResult.sourceRunId;
    expect(runResult.itemsFetched).toBe(2);

    const rawRecords = await prisma.rawRecord.findMany({ where: { sourceRunId: runResult.sourceRunId } });
    expect(rawRecords).toHaveLength(2);

    // No live BullMQ worker runs during tests: invoke the processor directly
    // for each raw record, the same way parse-raw-record.processor.spec.ts does.
    for (const rawRecord of rawRecords) {
      await processor.process({ data: { rawRecordId: rawRecord.id } } as never);
    }

    const notices = await prisma.tenderNotice.findMany({
      where: { sourceId: "uk_find_a_tender", sourceExternalId: { in: ["notice-1", "notice-2"] } },
    });
    expect(notices).toHaveLength(2);
    tenderIds = notices.map((n) => n.tenderId);

    const response = await tendersController.list({ limit: 25 });

    const notice1 = response.data.find((t) => t.title === "Case management software");
    const notice2 = response.data.find((t) => t.title === "Cloud migration services");

    expect(notice1).toBeDefined();
    expect(notice1?.buyerName).toBe("Example Council");
    expect(notice2).toBeDefined();
    expect(notice2?.buyerName).toBe("Another Council");
  });
});
