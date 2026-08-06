import { drizzle } from "drizzle-orm/d1";
import { isDevelopment, serverEnv } from "~/lib/env.server";
import * as schema from "./schema";

export const db = drizzle(serverEnv.DB, {
  schema,
  logger: isDevelopment,
});
