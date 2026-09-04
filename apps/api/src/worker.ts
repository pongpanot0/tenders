import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { WorkerModule } from "./worker.module";
import { OutboxRelayService } from "./outbox/outbox-relay.service";

const OUTBOX_POLL_INTERVAL_MS = 5000;

async function bootstrap() {
  const logger = new Logger("Worker");
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();

  const outboxRelay = app.get(OutboxRelayService);
  const intervalHandle = setInterval(() => {
    outboxRelay.relayOnce().catch((error) => logger.error("outbox relay failed", error));
  }, OUTBOX_POLL_INTERVAL_MS);

  // enableShutdownHooks() already registers OS signal listeners that run
  // onModuleDestroy on every provider (e.g. closing the BullMQ Worker), then
  // re-sends the signal to let the process terminate via Node's default
  // behavior. We only need to additionally clear our own interval before
  // that happens. Use `once` (not `on`) so our listener detaches after
  // firing — otherwise it would still be registered when Nest re-sends the
  // signal, which stops Node from applying its default termination
  // behavior and leaves the process hanging.
  const clearOutboxPolling = () => clearInterval(intervalHandle);
  process.once("SIGTERM", clearOutboxPolling);
  process.once("SIGINT", clearOutboxPolling);

  logger.log("worker started: parse consumer active, outbox relay polling every 5s");
}

bootstrap().catch((error) => {
  console.error("worker failed to start", error);
  process.exit(1);
});
