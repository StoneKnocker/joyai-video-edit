/// <reference path="../../worker-configuration.d.ts" />
import { env as cloudflareEnv } from "cloudflare:workers";
import { z } from "zod";
import type { PublicEnv } from "./public-env";

/**
 * Server environment schema.
 * Waitlist-only deploys only need APP_* / R2_DOMAIN (+ Cloudflare bindings).
 * Payment, auth provider, AI, and S3-style R2 secrets are optional until those
 * features are re-enabled.
 */
const serverEnvSchema = z.object({
  ENVIRONMENT: z.enum(["development", "production"]).default("development"),
  NEED_MOCK: z.string().optional().default("0"),
  APP_NAME: z.string().min(1),
  APP_URL: z.string().min(1),
  R2_DOMAIN: z.string().min(1),

  // R2 public config (optional until S3 API upload is used)
  R2_BUCKET_NAME: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  SEND_FROM_EMAIL: z.string().optional().default("support@localhost"),

  // Auth (optional for waitlist-only)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // better-auth session signing / encryption — must be ≥32 chars when set
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  UNOSEND_API_KEY: z.string().optional(),

  CREEM_API_KEY: z.string().optional(),
  CREEM_WEBHOOK_SECRET: z.string().optional(),
  /** Primary payment provider: subotiz | creem */
  PAYMENT_PROVIDER: z.enum(["subotiz", "creem"]).optional().default("subotiz"),
  // Subotiz (default payment provider)
  SUBOTIZ_API_KEY: z.string().optional(),
  /** Override API base; defaults to sandbox in development, prod in production */
  SUBOTIZ_API_BASE: z.string().url().optional(),
  /** Set false to disable Subotiz even if key is present */
  SUBOTIZ_ENABLED: z.string().optional().default("true"),
  /** Explicitly re-enable Creem as a selectable provider */
  CREEM_ENABLED: z.string().optional().default("false"),

  // AI providers (optional until generation is re-enabled)
  KIE_API_KEY: z.string().optional(),
  KIE_WEBHOOK_HMAC_KEY: z.string().optional(),
  /** Optional public base for KIE webhooks (e.g. ngrok in local dev). Falls back to APP_URL. */
  KIE_CALLBACK_BASE_URL: z.string().url().optional(),
  /** WaveSpeed content moderator API key (text/image moderation before video generation). */
  WAVESPEED_API_KEY: z.string().optional(),

  // PayPal (optional — enable with PAYPAL_ENABLED=true + credentials)
  PAYPAL_ENABLED: z.string().optional().default("false"),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_ENVIRONMENT: z
    .enum(["sandbox", "production"])
    .optional()
    .default("sandbox"),
});

type RequiredBindingName = "APP_KV" | "DB" | "R2";

function requireBinding<Name extends RequiredBindingName>(
  name: Name,
): NonNullable<Cloudflare.Env[Name]> {
  const binding = cloudflareEnv[name];

  if (!binding) {
    throw new Error(`Missing Cloudflare binding: ${name}`);
  }

  return binding;
}

/**
 * Validated server environment variables
 */
export const serverEnv = (() => {
  const parsed = serverEnvSchema.safeParse(cloudflareEnv);

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  const checkedEnv = Object.freeze({
    ...parsed.data,
    APP_KV: requireBinding("APP_KV"),
    DB: requireBinding("DB"),
    R2: requireBinding("R2"),
  });

  // Only log in development for better production security
  if (checkedEnv.ENVIRONMENT === "development") {
    console.log(`✅ Environment: ${checkedEnv.ENVIRONMENT}`);
  }

  return checkedEnv;
})();

// Environment convenience exports
export const isDevelopment = serverEnv.ENVIRONMENT === "development";

/**
 * Returns a subset of environment variables that are safe to expose to the client.
 * SECURITY WARNING: Be careful what you expose here - never include API keys,
 * secrets, or sensitive information as these will be visible in the browser.
 */
export function getPublicEnv(): PublicEnv {
  return {
    SEND_FROM_EMAIL: serverEnv.SEND_FROM_EMAIL,
    APP_NAME: serverEnv.APP_NAME,
    APP_URL: serverEnv.APP_URL,
    R2_DOMAIN: serverEnv.R2_DOMAIN,
  };
}
