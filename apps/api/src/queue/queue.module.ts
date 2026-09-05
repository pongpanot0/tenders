import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import type { AppEnv } from "../config/env.validation";
import { PARSE_QUEUE, PARSE_QUEUE_NAME } from "./queue.constants";

@Global()
@Module({
  providers: [
    {
      provide: PARSE_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>) =>
        new Queue(PARSE_QUEUE_NAME, {
          connection: { url: config.get("REDIS_URL", { infer: true }) } as never,
        }),
    },
  ],
  exports: [PARSE_QUEUE],
})
export class QueueModule {}
