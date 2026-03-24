import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters").optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.issues[0]?.message}`);
}

export const env = parsed.data;

export function requireAuthSecret() {
  return env.AUTH_SECRET ?? "dev-only-auth-secret-change-me-before-production";
}

export function requireOpenAIKey() {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for AI explanations.");
  }

  return env.OPENAI_API_KEY;
}
