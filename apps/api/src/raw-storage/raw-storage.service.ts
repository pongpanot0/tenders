import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";
import type { AppEnv } from "../config/env.validation";

@Injectable()
export class RawStorageService implements OnModuleInit {
  private client!: Client;
  private bucket!: string;

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  async onModuleInit() {
    this.bucket = this.config.get("OBJECT_STORAGE_BUCKET", { infer: true });
    this.client = new Client({
      endPoint: this.config.get("OBJECT_STORAGE_ENDPOINT", { infer: true }),
      port: Number(this.config.get("OBJECT_STORAGE_PORT", { infer: true })),
      useSSL: this.config.get("OBJECT_STORAGE_USE_SSL", { infer: true }) === "true",
      accessKey: this.config.get("OBJECT_STORAGE_ACCESS_KEY", { infer: true }),
      secretKey: this.config.get("OBJECT_STORAGE_SECRET_KEY", { infer: true }),
    });

    const exists = await this.client.bucketExists(this.bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async save(key: string, content: Buffer): Promise<string> {
    await this.client.putObject(this.bucket, key, content);
    return key;
  }

  async load(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
