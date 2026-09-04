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
