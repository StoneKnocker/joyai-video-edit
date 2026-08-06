import {
  emailOTPClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { serverAuth } from "./auth.server";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof serverAuth>(),
    lastLoginMethodClient(),
    emailOTPClient(),
  ],
});
