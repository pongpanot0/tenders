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
