import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
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
