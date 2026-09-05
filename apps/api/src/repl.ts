import "reflect-metadata";
import { repl } from "@nestjs/core";
import { WorkerModule } from "./worker.module";

async function bootstrap() {
  await repl(WorkerModule);
}

bootstrap();
