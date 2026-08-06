import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

// Define privacy policy collection
const posts = defineCollection({
  name: "posts",
  directory: "content",
  include: ["**/*.md", "**/*.mdx"],
  schema: z.object({
    title: z.string(),
    lang: z.string(),
    kind: z.enum(["policy", "blog"]).optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    publishedAt: z.string().datetime().optional(),
    lastModified: z.string().datetime(),
    cover: z.string().url().optional(),
    authorName: z.string().optional(),
    authorAvatar: z.string().url().optional(),
    content: z.string(),
  }),
});

export default defineConfig({
  collections: [posts],
});
