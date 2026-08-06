import { ArrowRight, Play } from "lucide-react";
import { useState } from "react";
import { Link } from "~/components/i18n-link";
import { Button } from "~/components/ui/button";
import { VideoLightbox } from "~/components/video-lightbox";
import { useAppName } from "~/lib/public-env";

const VIDEO_BASE = "https://cdn.vidrushai.com/seedance2-assets";

const GALLERY_ITEMS = [
  {
    id: 1,
    videoNum: 1,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-1.webp",
    alt: "AI video example 1",
  },
  {
    id: 2,
    videoNum: 2,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-2.webp",
    alt: "AI video example 2",
  },
  {
    id: 3,
    videoNum: 19,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-19.webp",
    alt: "AI video example 3",
  },
  {
    id: 4,
    videoNum: 4,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-4.webp",
    alt: "AI video example 4",
  },
  {
    id: 5,
    videoNum: 5,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-5.webp",
    alt: "AI video example 5",
  },
  {
    id: 6,
    videoNum: 17,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-17.webp",
    alt: "AI video example 6",
  },
  {
    id: 7,
    videoNum: 40,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-40.webp",
    alt: "AI video example 7",
  },
  {
    id: 8,
    videoNum: 8,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-8.webp",
    alt: "AI video example 8",
  },
  {
    id: 9,
    videoNum: 14,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-14.webp",
    alt: "AI video example 9",
  },
  {
    id: 10,
    videoNum: 10,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-10.webp",
    alt: "AI video example 10",
  },
  {
    id: 11,
    videoNum: 30,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-30.webp",
    alt: "AI video example 11",
  },
  {
    id: 12,
    videoNum: 38,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-38.webp",
    alt: "AI video example 12",
  },
  {
    id: 13,
    videoNum: 16,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-16.webp",
    alt: "AI video example 13",
  },
  {
    id: 14,
    videoNum: 45,
    poster: "https://cdn.vidrushai.com/seedance2-assets/poster-45.webp",
    alt: "AI video example 14",
  },
];

type GalleryItem = (typeof GALLERY_ITEMS)[number];

function GalleryCard({
  item,
  onPlay,
}: {
  item: GalleryItem;
  onPlay: (item: GalleryItem) => void;
}) {
  return (
    <div className="mb-4 break-inside-avoid">
      <button
        type="button"
        onClick={() => onPlay(item)}
        aria-label={`Play ${item.alt}`}
        className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left shadow-lg transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_15px_rgba(0,217,146,0.14)]"
      >
        <img
          src={item.poster}
          alt={item.alt}
          loading="lazy"
          className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 opacity-80 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 md:h-16 md:w-16">
            <Play
              className="ml-1 h-6 w-6 text-foreground md:h-7 md:w-7"
              fill="currentColor"
            />
          </div>
        </div>
      </button>
    </div>
  );
}

export function SeedanceGallery() {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const appName = useAppName();

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Get Inspired
          </h2>
          <p className="mx-auto mt-6 max-w-4xl text-lg leading-relaxed text-muted-foreground">
            Explore stunning video examples created with {appName}&apos;s
            multi-modal capabilities.
          </p>
        </div>

        <div className="w-full columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {GALLERY_ITEMS.map((item) => (
            <GalleryCard key={item.id} item={item} onPlay={setActiveItem} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,217,146,0.28)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_36px_rgba(0,217,146,0.4)]"
          >
            <Link to="/showcase">
              View More Showcases
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {activeItem && (
        <VideoLightbox
          src={`${VIDEO_BASE}/video-${activeItem.videoNum}.mp4`}
          poster={activeItem.poster}
          onClose={() => setActiveItem(null)}
        />
      )}
    </section>
  );
}
