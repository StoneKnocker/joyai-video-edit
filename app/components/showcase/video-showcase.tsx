import { useState } from "react";
import { cn } from "~/lib/utils";
import { VideoLightbox } from "~/components/video-lightbox";
import {
  filterCategories,
  showcaseItems,
  type ShowcaseItem,
  type FilterCategory,
} from "./showcase-data";
import { VideoCard } from "./video-card";

export function VideoShowcase() {
  const [active, setActive] = useState<ShowcaseItem | null>(null);
  const [filter, setFilter] = useState<FilterCategory>("All");

  const items =
    filter === "All"
      ? showcaseItems
      : showcaseItems.filter((item) => item.category === filter);

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {filterCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-all duration-200",
              filter === category
                ? "border-primary bg-primary/10 text-primary"
                : "border-[#3d3a39] text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {items.map((item) => (
          <VideoCard key={item.id} item={item} onPlay={setActive} />
        ))}
      </div>

      {active && (
        <VideoLightbox
          src={active.video}
          poster={active.poster}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
