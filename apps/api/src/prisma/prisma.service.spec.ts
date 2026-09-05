import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  it("connects and can query the sources table", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    const prisma = moduleRef.get(PrismaService);
    await prisma.onModuleInit();

    const count = await prisma.sourceRegistry.count();
    expect(typeof count).toBe("number");

    await prisma.onModuleDestroy();
  });
});
