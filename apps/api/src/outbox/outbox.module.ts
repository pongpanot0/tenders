import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxRelayService } from "./outbox-relay.service";

@Module({
  providers: [PrismaService, OutboxRelayService],
  exports: [OutboxRelayService],
})
export class OutboxModule {}
