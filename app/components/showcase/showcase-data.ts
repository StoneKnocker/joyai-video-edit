const R2_DOMAIN = "https://cdn.vidrushai.com";
const SHOWCASE_BASE = `${R2_DOMAIN}/showcase`;

export const itemCategories = [
  "Cinematic",
  "Animation",
  "Portrait",
  "Motion",
  "Product",
] as const;

export type ShowcaseCategory = (typeof itemCategories)[number];

export const filterCategories = ["All", ...itemCategories] as const;
export type FilterCategory = (typeof filterCategories)[number];

export interface ShowcaseItem {
  id: string;
  poster: string;
  video: string;
  title: string;
  category: ShowcaseCategory;
}

const ids = Array.from({ length: 36 }, (_, i) => 48 - i);

export const showcaseItems: ShowcaseItem[] = ids.map((n, i) => ({
  id: String(n),
  poster: `${SHOWCASE_BASE}/posters/${n}-poster.webp`,
  video: `${SHOWCASE_BASE}/videos/${n}.mp4`,
  title: `Showcase ${n}`,
  category: itemCategories[i % itemCategories.length] as ShowcaseCategory,
}));
