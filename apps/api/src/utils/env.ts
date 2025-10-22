import dotenv from "dotenv";

type EnvConfig = Record<string, string | undefined>;

export function loadEnvConfig(): EnvConfig {
  dotenv.config();
  return {
    APP_DOMAIN: process.env.APP_DOMAIN,
    API_DOMAIN: process.env.API_DOMAIN,
    ADMIN_DOMAIN: process.env.ADMIN_DOMAIN,
    API_PORT: process.env.API_PORT,
    ADMIN_PORT: process.env.ADMIN_PORT,
    QWEN_BASE_URL: process.env.QWEN_BASE_URL,
    QWEN_API_KEY: process.env.QWEN_API_KEY,
    TEMPERATURE: process.env.TEMPERATURE,
    MAX_TOKENS: process.env.MAX_TOKENS,
    HOST_SECRET: process.env.HOST_SECRET || "decompo-host",
    LOG_SAMPLE_ENABLED: process.env.LOG_SAMPLE_ENABLED || "false",
    DB_PATH: process.env.DB_PATH || "runtime/decompo.db"
  } satisfies EnvConfig;
}
