import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { TendersModule } from "./tenders/tenders.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), TendersModule],
  controllers: [HealthController],
})
export class AppModule {}
