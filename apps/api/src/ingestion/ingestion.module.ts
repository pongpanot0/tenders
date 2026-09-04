import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageModule } from "../raw-storage/raw-storage.module";
import { QueueModule } from "../queue/queue.module";
import { IngestionService } from "./ingestion.service";

@Module({
  imports: [RawStorageModule, QueueModule],
  providers: [PrismaService, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
