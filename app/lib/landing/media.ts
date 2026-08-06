/** Research-sourced landing media. Images are on project R2 CDN (<100KB each). */

export const LANDING_CDN_BASE = "https://cdn.joyaivideoedit.com/landing";

export const landingImages = {
  teaser: `${LANDING_CDN_BASE}/teaser.webp`,
  cases: [
    {
      id: "case01",
      title: "Subject edit",
      source: `${LANDING_CDN_BASE}/case01_source.webp`,
      edited: `${LANDING_CDN_BASE}/case01_edited.webp`,
    },
    {
      id: "case02",
      title: "Local edit",
      source: `${LANDING_CDN_BASE}/case02_source.webp`,
      edited: `${LANDING_CDN_BASE}/case02_edited.webp`,
    },
    {
      id: "case03",
      title: "Background edit",
      source: `${LANDING_CDN_BASE}/case03_source.webp`,
      edited: `${LANDING_CDN_BASE}/case03_edited.webp`,
    },
    {
      id: "case04",
      title: "Style edit",
      source: `${LANDING_CDN_BASE}/case04_source.webp`,
      edited: `${LANDING_CDN_BASE}/case04_edited.webp`,
    },
    {
      id: "case05",
      title: "Reference-guided edit",
      source: `${LANDING_CDN_BASE}/case05_source.webp`,
      edited: `${LANDING_CDN_BASE}/case05_edited.webp`,
    },
  ],
} as const;

/** Official showcase demo from JoyAI-Video-Edit GitHub README */
export const showcaseVideoUrl =
  "https://github.com/user-attachments/assets/bca232c9-75df-46f9-b366-14cfa2651994";

export const allLandingImageUrls: string[] = [
  landingImages.teaser,
  ...landingImages.cases.flatMap((c) => [c.source, c.edited]),
];
