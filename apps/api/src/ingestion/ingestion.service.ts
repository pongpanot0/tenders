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
