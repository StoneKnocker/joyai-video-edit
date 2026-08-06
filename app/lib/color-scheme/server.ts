import { createCookie } from "react-router";
import type { ColorScheme } from "./components";

const cookie = createCookie("__color-scheme", {
  maxAge: 34560000,
  sameSite: "lax",
});

export async function parseColorScheme(request: Request): Promise<ColorScheme> {
  const header = request.headers.get("Cookie");
  const vals = await cookie.parse(header);
  const scheme = vals?.colorScheme as ColorScheme | undefined;
  if (scheme === "light" || scheme === "dark" || scheme === "system") {
    return scheme;
  }
  return "light";
}
