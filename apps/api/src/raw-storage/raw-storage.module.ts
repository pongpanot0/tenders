import { Module } from "@nestjs/common";
import { RawStorageService } from "./raw-storage.service";

@Module({
  providers: [RawStorageService],
  exports: [RawStorageService],
})
export class RawStorageModule {}
