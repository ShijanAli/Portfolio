import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  /** Public URLs, used to build links in emails and URLs of locally stored uploads. */
  WEB_URL: z.url().default('http://localhost:3000'),
  API_PUBLIC_URL: z.url().default('http://localhost:4000'),

  /**
   * Address the API uses to reach the website for cache refreshes, when that differs from
   * the public WEB_URL (e.g. `http://web:3000` inside a Docker network).
   */
  WEB_INTERNAL_URL: z.url().optional(),
  /**
   * Authorizes the scheduled-job endpoints. On Vercel, set it in the project and Vercel
   * sends it with every cron call. Without it those endpoints are disabled.
   */
  CRON_SECRET: z.string().min(16).optional(),
  /** Shared secret for telling the website to refresh cached pages after an edit. */
  WEB_REVALIDATE_SECRET: z.string().min(16).optional(),

  /** Email (Brevo). Without an API key, emails are logged instead of sent. */
  BREVO_API_KEY: z.string().min(1).optional(),
  MAIL_FROM_NAME: z.string().min(1).default('Portfolio'),
  MAIL_FROM_EMAIL: z.email().default('no-reply@example.com'),
  /** Where "new booking" and "new message" notifications are sent. */
  ADMIN_NOTIFY_EMAIL: z.email().optional(),

  /** File storage (Cloudinary). Without credentials, files are stored on local disk. */
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),

  /** Google Analytics 4 Data API (service account). Optional: shown in the admin dashboard. */
  GA4_PROPERTY_ID: z.string().regex(/^\d+$/).optional(),
  GA4_CLIENT_EMAIL: z.email().optional(),
  GA4_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((key) => key.replace(/\\n/g, '\n'))
    .optional(),
});

// An empty value in .env means "not set".
const definedEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== ''),
);

// Anything running on Vercel is production, even if NODE_ENV was copied over from a local
// .env as "development" (that would turn on dev-only logging and insecure cookies).
if (definedEnv.VERCEL) definedEnv.NODE_ENV = 'production';

const parsed = envSchema.safeParse(definedEnv);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
