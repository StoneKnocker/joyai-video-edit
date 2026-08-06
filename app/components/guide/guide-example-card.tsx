import { useState } from "react";
import { cn } from "@/lib/utils";
import type { GuideExample } from "./guide-data";

/** Highlight Image N / Video N references in prompt text. */
function PromptText({ text }: { text: string }) {
  const parts = text.split(
    /(\b(?:Image|Video)\s+\d+(?:\s*[&,]\s*(?:Image|Video)?\s*\d+)*(?:\s*\([^)]+\))?|\bImage\s+\d+(?:,\s*\d+)*(?:\s*and\s*\d+)?)/gi,
  );

  return (
    <p className="text-foreground/90 text-sm leading-relaxed">
      {parts.map((part) => {
        if (/^(Image|Video)\s+\d/i.test(part)) {
          return (
            <span
              key={`ref-${part}`}
              className="rounded bg-primary/15 px-1 py-0.5 font-semibold text-primary text-xs"
            >
              {part}
            </span>
          );
        }
        return <span key={`txt-${part.slice(0, 48)}`}>{part}</span>;
      })}
    </p>
  );
}

function MediaBadge({
  children,
  variant = "secondary",
}: {
  children: string;
  variant?: "secondary" | "outline";
}) {
  return (
    <span
      className={cn(
        "mb-2 inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold text-xs",
        variant === "secondary"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-secondary/60 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function GuideExampleCard({ example }: { example: GuideExample }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <article className="group overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_0_15px_rgba(92,88,85,0.12)] transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,217,146,0.12)]">
        <div className="p-5 md:p-6">
          <h4 className="mb-4 font-semibold text-base text-foreground transition-colors group-hover:text-primary md:text-lg">
            {example.title}
          </h4>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {example.cols.map((col, colIndex) => (
              <div key={`${example.id}-col-${col.badge ?? colIndex}`}>
                {col.badge ? (
                  <MediaBadge
                    variant={
                      col.badge.toLowerCase().includes("output")
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {col.badge}
                  </MediaBadge>
                ) : null}

                <div className="space-y-3">
                  {col.videos.map((src) => (
                    // biome-ignore lint/a11y/useMediaCaption: demo guide clips; no caption tracks available
                    <video
                      key={src}
                      src={src}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full rounded-xl border border-border object-cover"
                    />
                  ))}
                  {col.images.map((img) => (
                    <div key={img.src}>
                      <button
                        type="button"
                        className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/50"
                        onClick={() => setLightbox(img.src)}
                      >
                        <img
                          src={img.src}
                          alt={img.alt}
                          loading="lazy"
                          className="w-full object-cover"
                        />
                      </button>
                      {img.caption ? (
                        <p className="mt-1.5 text-muted-foreground text-xs">
                          {img.caption}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {example.prompt ? (
            <div className="mt-5 rounded-xl border border-border border-l-2 border-l-primary/60 bg-background/60 p-4">
              <p className="mb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Prompt
              </p>
              <PromptText text={example.prompt} />
            </div>
          ) : null}
        </div>
      </article>

      {lightbox ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          aria-label="Close image preview"
        >
          <img
            src={lightbox}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-xl border border-border object-contain shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
          />
        </button>
      ) : null}
    </>
  );
}
