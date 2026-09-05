import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RawStorageModule } from "../raw-storage/raw-storage.module";
import { TenderProcessorService } from "../tender-processing/tender-processor.service";
import { ParseRawRecordProcessor } from "./parse-raw-record.processor";

@Module({
  imports: [RawStorageModule],
  providers: [PrismaService, TenderProcessorService, ParseRawRecordProcessor],
  exports: [ParseRawRecordProcessor],
})
export class ParsingModule {}
