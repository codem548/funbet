import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url().default('http://localhost:5173'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Database
  DATABASE_URL: z.string().min(1),

  // Bcrypt
  BCRYPT_ROUNDS: z.coerce.number().default(12).min(10).max(15),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  // Rate limiting
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),
  RATE_LIMIT_API_MAX: z.coerce.number().default(100),
  RATE_LIMIT_FINANCIAL_MAX: z.coerce.number().default(10),
  RATE_LIMIT_GAME_MAX: z.coerce.number().default(60),

  // Payment providers (optional)
  MTN_API_KEY: z.string().optional(),
  MTN_API_SECRET: z.string().optional(),
  MTN_API_URL: z.string().url().optional(),
  ORANGE_API_KEY: z.string().optional(),
  ORANGE_API_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
