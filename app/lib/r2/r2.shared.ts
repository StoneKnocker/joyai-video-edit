export function buildR2Url(
  pathOrUrl: string,
  domain: string | undefined,
): string {
  if (!pathOrUrl) {
    return "";
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const normalizedDomain = domain?.replace(/\/+$/, "");
  const normalizedPath = pathOrUrl.replace(/^\/+/, "");

  if (!normalizedDomain) {
    throw new Error("R2_DOMAIN is required to build R2 public URLs.");
  }

  return `${normalizedDomain}/${normalizedPath}`;
}
