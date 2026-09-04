import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageModule } from "../raw-storage/raw-storage.module";
import { IngestionService } from "./ingestion.service";

@Module({
  imports: [RawStorageModule],
  providers: [PrismaService, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
