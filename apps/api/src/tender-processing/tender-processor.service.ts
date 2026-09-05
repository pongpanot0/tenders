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
