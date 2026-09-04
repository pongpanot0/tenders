import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ParsingModule } from "./parsing/parsing.module";
import { OutboxModule } from "./outbox/outbox.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), ParsingModule, OutboxModule],
})
export class WorkerModule {}
