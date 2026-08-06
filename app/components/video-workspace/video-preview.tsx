import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Info,
  Loader2,
} from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import type { WorkspaceTaskState } from "./workspace-types";

const EXAMPLE_ASSET_BASE = "https://cdn.vidrushai.com/seedance2-assets";

const EXAMPLE_VIDEOS = [
  {
    id: 1,
    src: `${EXAMPLE_ASSET_BASE}/example-video.mp4`,
    poster: `${EXAMPLE_ASSET_BASE}/example-poster.webp`,
  },
  {
    id: 2,
    src: `${EXAMPLE_ASSET_BASE}/example-video-2.mp4`,
    poster: `${EXAMPLE_ASSET_BASE}/example-poster-2.webp`,
  },
  {
    id: 3,
    src: `${EXAMPLE_ASSET_BASE}/example-video-3.mp4`,
    poster: `${EXAMPLE_ASSET_BASE}/example-poster-3.webp`,
  },
] as const;

export interface VideoPreviewProps {
  showGuide?: boolean;
  taskState?: WorkspaceTaskState;
}

export function VideoPreview({
  showGuide = false,
  taskState = { status: "idle", videoUrls: [], imageUrls: [] },
}: VideoPreviewProps) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const activeVideoUrl = taskState.videoUrls[0];
  const isWorking =
    taskState.status === "pending" || taskState.status === "processing";
  const isFailed = taskState.status === "failed";
  const showExampleCarousel = !activeVideoUrl && !isWorking && !isFailed;
  const exampleVideo = EXAMPLE_VIDEOS[exampleIndex] ?? EXAMPLE_VIDEOS[0];

  const goToPrevious = () => {
    setExampleIndex(
      (current) =>
        (current - 1 + EXAMPLE_VIDEOS.length) % EXAMPLE_VIDEOS.length,
    );
  };

  const goToNext = () => {
    setExampleIndex((current) => (current + 1) % EXAMPLE_VIDEOS.length);
  };

  return (
    <div className="flex w-full flex-1 flex-col gap-4 lg:w-auto">
      <div
        className={cn(
          "relative flex w-full flex-col overflow-hidden",
          "h-auto min-h-[200px] lg:h-[650px]",
          "rounded-3xl border-border/50",
          "bg-muted/10 shadow-2xl backdrop-blur-sm",
        )}
      >
        <div className="flex h-full flex-1 flex-col items-center justify-center bg-muted/30 p-4 text-center sm:p-8">
          <div className="h-full w-full">
            <div className="flex h-full h-full w-full flex-col overflow-hidden rounded-2xl opacity-80 transition-opacity duration-500 hover:opacity-100">
              <div className="relative flex flex-1 flex-col">
                <div className="group relative aspect-video overflow-hidden rounded-xl bg-black">
                  {isWorking ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="font-medium text-sm">
                        {taskState.status === "pending"
                          ? "Task queued"
                          : "Generating video"}
                      </p>
                    </div>
                  ) : isFailed ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-white">
                      <p className="font-semibold text-sm">Generation failed</p>
                      <p className="max-w-md text-muted-foreground text-xs">
                        {taskState.errorMessage || "Please try again."}
                      </p>
                    </div>
                  ) : (
                    <video
                      key={activeVideoUrl ?? exampleVideo.src}
                      className="h-full w-full object-contain"
                      controls
                      poster={activeVideoUrl ? undefined : exampleVideo.poster}
                      preload="metadata"
                      playsInline
                    >
                      <source
                        src={activeVideoUrl ?? exampleVideo.src}
                        type="video/mp4"
                      />
                    </video>
                  )}
                  {showExampleCarousel ? (
                    <>
                      <button
                        type="button"
                        aria-label="Previous video"
                        onClick={goToPrevious}
                        className={cn(
                          "-translate-y-1/2 absolute top-1/2 left-2 md:left-4",
                          "rounded-full bg-black/50 p-1.5 text-white md:p-2",
                          "transition-all duration-200 hover:scale-110 hover:bg-black/70",
                          "opacity-70 md:opacity-0 md:group-hover:opacity-100",
                        )}
                      >
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next video"
                        onClick={goToNext}
                        className={cn(
                          "-translate-y-1/2 absolute top-1/2 right-2 md:right-4",
                          "rounded-full bg-black/50 p-1.5 text-white md:p-2",
                          "transition-all duration-200 hover:scale-110 hover:bg-black/70",
                          "opacity-70 md:opacity-0 md:group-hover:opacity-100",
                        )}
                      >
                        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                      </button>
                    </>
                  ) : null}
                </div>
                {showExampleCarousel ? (
                  <div className="mt-3 flex justify-center gap-2">
                    {EXAMPLE_VIDEOS.map((video, index) => (
                      <button
                        key={video.id}
                        type="button"
                        aria-label={`Go to video ${index + 1}`}
                        aria-current={
                          index === exampleIndex ? "true" : undefined
                        }
                        onClick={() => setExampleIndex(index)}
                        className={cn(
                          "rounded-full transition-all duration-200",
                          index === exampleIndex
                            ? "h-2 w-6 bg-primary"
                            : "h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showGuide && (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-2xl border p-5",
            "bg-card",
            "",
          )}
        >
          <h3 className="font-semibold text-foreground text-lg">
            Multi Reference Guide
          </h3>

          <p className="text-muted-foreground text-sm leading-6">
            Seedance 2.0 supports text, image, video, and audio as input
            references. Combine multiple types of materials to guide AI video
            generation with greater precision and creative control.
          </p>

          <a
            href="#"
            className="inline-flex items-center gap-1 text-foreground text-sm hover:underline"
          >
            For a detailed Seedance 2.0 tutorial, check out our{" "}
            <span className="font-medium">Full Guide</span>
            <ExternalLink className="h-4 w-4" />
          </a>

          <div className="flex flex-col gap-4 pt-1">
            <GuideSection
              icon={<FileText className="h-4 w-4 text-foreground" />}
              title="Prompt Guide"
            >
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground text-sm">
                <li>
                  Type @ to quickly insert your uploaded files into the prompt.
                </li>
                <li>
                  Select a file to insert it as a reference (e.g. @Image1,
                  @Video1, @Audio1), so the AI knows exactly which material to
                  use.
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              icon={<FileText className="h-4 w-4 text-foreground" />}
              title="Material Limits"
            >
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground text-sm">
                <li>Up to 9 reference images</li>
                <li>Up to 3 reference videos, total duration ≤ 15 seconds</li>
                <li>Up to 3 reference audios, total duration ≤ 15 seconds</li>
                <li>Maximum 12 materials in total across all types</li>
              </ul>
            </GuideSection>

            <GuideSection
              icon={<FileText className="h-4 w-4 text-foreground" />}
              title="Supported Input Combinations"
            >
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground text-sm">
                <li>Text + Image</li>
                <li>Text + Video</li>
                <li>Text + Image + Video</li>
                <li>Text + Image + Audio</li>
                <li>Text + Video + Audio</li>
                <li>Text + Image + Video + Audio</li>
              </ul>
            </GuideSection>

            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <p className="text-muted-foreground text-sm">
                <span className="font-medium text-foreground">Note:</span> Audio
                cannot be used alone with text — at least one image or video is
                required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface GuideSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function GuideSection({ icon, title, children }: GuideSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default VideoPreview;
