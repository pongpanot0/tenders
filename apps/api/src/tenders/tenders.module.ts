import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TendersController } from "./tenders.controller";

@Module({
  controllers: [TendersController],
  providers: [PrismaService],
})
export class TendersModule {}
