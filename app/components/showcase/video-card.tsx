import { Play } from "lucide-react";
import type { ShowcaseItem } from "./showcase-data";

interface VideoCardProps {
  item: ShowcaseItem;
  onPlay: (item: ShowcaseItem) => void;
}

export function VideoCard({ item, onPlay }: VideoCardProps) {
  return (
    <div className="mb-4 break-inside-avoid">
      <button
        type="button"
        onClick={() => onPlay(item)}
        aria-label={`Play ${item.title}`}
        className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left shadow-lg transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_15px_rgba(0,217,146,0.14)]"
      >
        <img
          src={item.poster}
          alt={item.title}
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
