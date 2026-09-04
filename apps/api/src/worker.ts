import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { WorkerModule } from "./worker.module";
import { OutboxRelayService } from "./outbox/outbox-relay.service";

const OUTBOX_POLL_INTERVAL_MS = 5000;

async function bootstrap() {
  const logger = new Logger("Worker");
  const app = await NestFactory.createApplicationContext(WorkerModule);

  const outboxRelay = app.get(OutboxRelayService);
  setInterval(() => {
    outboxRelay.relayOnce().catch((error) => logger.error("outbox relay failed", error));
  }, OUTBOX_POLL_INTERVAL_MS);

  logger.log("worker started: parse consumer active, outbox relay polling every 5s");
}

bootstrap();
