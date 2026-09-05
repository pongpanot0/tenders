import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { Queue } from "bullmq";
import { QueueModule } from "./queue.module";
import { PARSE_QUEUE } from "./queue.constants";
import { validateEnv } from "../config/env.validation";

describe("QueueModule", () => {
  it("provides a BullMQ Queue for the parse queue", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), QueueModule],
    }).compile();

    const queue = moduleRef.get<Queue>(PARSE_QUEUE);
    expect(queue).toBeInstanceOf(Queue);
    expect(queue.name).toBe("parse-raw-record");

    await queue.close();
  });
});
