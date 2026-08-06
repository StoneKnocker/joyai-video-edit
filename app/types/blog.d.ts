export interface BlogPost {
  title: string;
  lang: string;
  kind?: "policy" | "blog";
  slug?: string;
  description?: string;
  publishedAt?: string;
  lastModified: string;
  cover?: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  _meta?: {
    fileName?: string;
  };
}
