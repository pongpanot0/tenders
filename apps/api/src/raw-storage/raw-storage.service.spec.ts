import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { RawStorageService } from "./raw-storage.service";
import { validateEnv } from "../config/env.validation";

describe("RawStorageService", () => {
  it("saves and loads a raw payload round trip", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
      providers: [RawStorageService],
    }).compile();

    const service = moduleRef.get(RawStorageService);
    await service.onModuleInit();

    const key = `test/${Date.now()}.json`;
    await service.save(key, Buffer.from('{"ocid":"abc"}'));

    const loaded = await service.load(key);
    expect(loaded.toString("utf-8")).toBe('{"ocid":"abc"}');
  });
});
