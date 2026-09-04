import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { decodeCursor, encodeCursor } from "./cursor.util";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const limit = Math.max(1, Math.min(Number(query.limit) || 25, 100));
    let cursorId: string | undefined;
    if (query.cursor) {
      cursorId = decodeCursor(query.cursor);
      if (!UUID_RE.test(cursorId)) {
        throw new BadRequestException("Invalid cursor");
      }
    }

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
