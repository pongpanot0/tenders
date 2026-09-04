import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TendersController } from "./tenders.controller";
import { validateEnv } from "../config/env.validation";

describe("TendersController", () => {
  let prisma: PrismaService;
  let controller: TendersController;
  let tenderId: string | null = null;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      controllers: [TendersController],
      providers: [PrismaService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();
    controller = moduleRef.get(TendersController);
  });

  afterAll(async () => {
    // Clean up test data in FK-safe order (child before parent)
    if (tenderId) {
      await prisma.tender.update({ where: { id: tenderId }, data: { currentVersionId: null } });
      await prisma.tenderVersion.deleteMany({ where: { tenderId } });
      await prisma.tender.delete({ where: { id: tenderId } });
    }

    await prisma.onModuleDestroy();
  });

  it("lists tenders with their current version data", async () => {
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
    const tender = await prisma.tender.create({
      data: { canonicalKey: `uk_find_a_tender:notice-list-1`, sourceId: source.id },
    });
    tenderId = tender.id;
    const version = await prisma.tenderVersion.create({
      data: {
        tenderId: tender.id,
        contentHash: "hash-list-1",
        normalizedJson: { title: "List test tender", buyer: { name: "X Council", countryCode: "GB" } },
        publishedAt: new Date("2026-09-01T00:00:00Z"),
      },
    });
    await prisma.tender.update({ where: { id: tender.id }, data: { currentVersionId: version.id } });

    const response = await controller.list({ limit: 25 });

    expect(response.data.some((t) => t.id === tender.id)).toBe(true);
    expect(response.meta.requestId).toBeDefined();
    expect(response.page).toHaveProperty("hasMore");
  });

  it("clamps a negative or zero limit to a sane minimum instead of an invalid Prisma take", async () => {
    await expect(controller.list({ limit: -5 })).resolves.toBeDefined();
    await expect(controller.list({ limit: 0 })).resolves.toBeDefined();
  });

  it("rejects a malformed cursor with a 400 instead of a 500", async () => {
    await expect(controller.list({ cursor: "not-a-real-cursor" })).rejects.toThrow(BadRequestException);
  });
});
