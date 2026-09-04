import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxRelayService } from "./outbox-relay.service";
import { validateEnv } from "../config/env.validation";

describe("OutboxRelayService", () => {
  let prisma: PrismaService;
  let service: OutboxRelayService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      providers: [PrismaService, OutboxRelayService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
    service = moduleRef.get(OutboxRelayService);
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("marks unpublished outbox events as published", async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        eventType: "tender.version.published",
        aggregateType: "tender",
        aggregateId: "ten_relay_test",
        payloadJson: { tenderId: "ten_relay_test" },
      },
    });

    const relayedCount = await service.relayOnce();
    expect(relayedCount).toBeGreaterThanOrEqual(1);

    const reloaded = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: event.id } });
    expect(reloaded.publishedAt).not.toBeNull();
  });
});
