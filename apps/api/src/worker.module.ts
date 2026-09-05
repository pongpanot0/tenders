import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ParsingModule } from "./parsing/parsing.module";
import { OutboxModule } from "./outbox/outbox.module";
import { IngestionModule } from "./ingestion/ingestion.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ParsingModule,
    OutboxModule,
    IngestionModule,
  ],
})
export class WorkerModule {}
