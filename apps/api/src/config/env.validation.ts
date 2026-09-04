export interface AppEnv {
  DATABASE_URL: string;
  REDIS_URL: string;
  OBJECT_STORAGE_ENDPOINT: string;
  OBJECT_STORAGE_PORT: string;
  OBJECT_STORAGE_USE_SSL: string;
  OBJECT_STORAGE_ACCESS_KEY: string;
  OBJECT_STORAGE_SECRET_KEY: string;
  OBJECT_STORAGE_BUCKET: string;
  APP_BASE_URL: string;
}

const REQUIRED_KEYS: (keyof AppEnv)[] = [
  "DATABASE_URL",
  "REDIS_URL",
  "OBJECT_STORAGE_ENDPOINT",
  "OBJECT_STORAGE_PORT",
  "OBJECT_STORAGE_USE_SSL",
  "OBJECT_STORAGE_ACCESS_KEY",
  "OBJECT_STORAGE_SECRET_KEY",
  "OBJECT_STORAGE_BUCKET",
  "APP_BASE_URL",
];

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const missing = REQUIRED_KEYS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  return config as unknown as AppEnv;
}
