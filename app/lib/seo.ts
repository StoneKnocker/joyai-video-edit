export function buildSocialMeta({
  title,
  description,
  url,
  imageUrl,
  type = "website",
}: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  type?: "website" | "article";
}) {
  const tags: Array<
    { property: string; content: string } | { name: string; content: string }
  > = [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (imageUrl) {
    tags.push(
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: imageUrl },
    );
  } else {
    tags.push({ name: "twitter:card", content: "summary" });
  }

  return tags;
}
