export function replaceAppNamePlaceholders<T>(value: T, appName: string): T {
  if (typeof value === "string") {
    return value.replaceAll("{{appName}}", appName) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceAppNamePlaceholders(item, appName)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceAppNamePlaceholders(item, appName),
      ]),
    ) as T;
  }

  return value;
}
