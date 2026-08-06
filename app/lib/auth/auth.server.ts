import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { lastLoginMethod } from "better-auth/plugins";
import { db } from "~/lib/database/db.server";
import { serverEnv } from "~/lib/env.server";
import { deleteFromR2 } from "~/lib/r2/r2.server";
import { ensureReviewTestAccountCredits } from "~/lib/service/userService";
import { createUserSourceForNewUser } from "~/lib/service/userSourceService";
import { emailOTPConfig } from "./unosendEmailOTP";

export const serverAuth = betterAuth({
  // Explicit secret from validated env — do not rely on process.env alone on Workers
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.APP_URL,
  trustedOrigins: [serverEnv.APP_URL],
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Handle user source creation after successful authentication
      const newSession = ctx.context.newSession;
      if (newSession?.user?.id && ctx.request && ctx.headers) {
        console.log("new user session detected, creating user source");
        try {
          await createUserSourceForNewUser(
            newSession.user.id,
            ctx.request,
            ctx.headers,
          );
        } catch (error) {
          // Log error but don't block authentication
          console.error("Failed to create user source:", error);
        }

        // Keep payment review test account funded for auditors
        try {
          await ensureReviewTestAccountCredits(
            newSession.user.id,
            newSession.user.email,
          );
        } catch (error) {
          console.error("Failed to ensure review test credits:", error);
        }
      }
    }),
  },
  secondaryStorage: {
    // better-auth stores pre-stringified JSON and passes TTL in seconds.
    // Do not re-JSON.stringify; honor TTL so KV keys expire with sessions/rate limits.
    get: async (key) => await serverEnv.APP_KV.get(`_auth:${key}`),
    set: async (key, value, ttl) => {
      // Cloudflare KV requires expirationTtl >= 60 when set.
      const options =
        typeof ttl === "number" && ttl > 0
          ? { expirationTtl: Math.max(Math.floor(ttl), 60) }
          : undefined;
      await serverEnv.APP_KV.put(`_auth:${key}`, value, options);
    },
    delete: async (key) => await serverEnv.APP_KV.delete(`_auth:${key}`),
  },
  socialProviders: {
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      trustedProviders: ["google"],
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false,
      },
    },
    deleteUser: {
      enabled: true,
      afterDelete: async (user) => {
        if (user.image) {
          await deleteUserImageFromR2(user.image);
        }
      },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
    window: 60, // time window in seconds
    max: 10, // max requests in the window
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
    },
  },
  plugins: [lastLoginMethod(), emailOTPConfig],
  emailAndPassword: {
    enabled: false,
  },
});

export async function getServerSession(request: Request) {
  return serverAuth.api.getSession({
    headers: request.headers,
  });
}

function getR2ObjectKeyFromImage(imageUrl: string): string | null {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const parsedImageUrl = new URL(imageUrl);
      const parsedR2Domain = new URL(serverEnv.R2_DOMAIN);

      if (parsedImageUrl.host !== parsedR2Domain.host) {
        return null;
      }

      return parsedImageUrl.pathname.replace(/^\/+/, "") || null;
    } catch {
      return null;
    }
  }

  let key = imageUrl.split("?").at(0)?.replace(/^\/+/, "") ?? "";
  if (key.startsWith("images/")) {
    key = key.slice("images/".length);
  }

  return key || null;
}

export const deleteUserImageFromR2 = async (imageUrl: string | null) => {
  if (!imageUrl) return;

  const r2ObjectKey = getR2ObjectKeyFromImage(imageUrl);
  if (r2ObjectKey) {
    await deleteFromR2(r2ObjectKey);
  }
};

export type AuthServerSession = Awaited<
  ReturnType<typeof serverAuth.api.getSession>
>;
