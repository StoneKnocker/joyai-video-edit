import { Download, Music, Play, Video, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogOverlay, DialogPortal } from "~/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import type { SeedanceCreateTaskInput } from "~/lib/ai/seedance.shared";
import { getTaskResultMedia } from "~/lib/ai/seedance.shared";
import { getUserCompletedTasksPaginated } from "~/lib/model/userTask";
import { useR2Domain } from "~/lib/public-env";
import { buildR2Url } from "~/lib/r2/r2.shared";
import { cn } from "~/lib/utils";
import { requireUser } from "~/middlewares/auth-guard";
import type { Route } from "./+types/creations";

const PAGE_SIZE = 12;

const MODE_LABELS: Record<string, string> = {
  "multi-reference": "Multi Reference",
  "image-to-video": "Image to Video",
  "text-to-video": "Text to Video",
};

type CreationItem = {
  id: string;
  mode: string;
  prompt: string;
  videoKey: string;
  posterKey?: string;
  resolution?: string;
  duration?: number;
  aspectRatio?: string;
  generateAudio?: boolean;
  referenceImageUrls: string[];
  referenceVideoUrls: string[];
  referenceAudioUrls: string[];
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  creditCost: number;
  createdAt: Date;
};

function asInput(value: unknown): SeedanceCreateTaskInput | null {
  if (!value || typeof value !== "object") return null;
  return value as SeedanceCreateTaskInput;
}

function mapTaskToCreation(task: {
  id: string;
  mode: string;
  prompt: string;
  input: unknown;
  resultData: unknown;
  creditCost: number;
  createdAt: Date;
}): CreationItem | null {
  const media = getTaskResultMedia(task.resultData);
  const videoKey = media.videoKeys[0];
  if (!videoKey) return null;

  const input = asInput(task.input);
  const referenceImageUrls =
    input?.mode === "multi-reference" ? (input.referenceImageUrls ?? []) : [];
  const referenceVideoUrls =
    input?.mode === "multi-reference" ? (input.referenceVideoUrls ?? []) : [];
  const referenceAudioUrls =
    input?.mode === "multi-reference" ? (input.referenceAudioUrls ?? []) : [];

  return {
    id: task.id,
    mode: task.mode,
    prompt: task.prompt,
    videoKey,
    posterKey: media.posterKey,
    resolution: input?.resolution,
    duration: input?.duration,
    aspectRatio: input?.aspectRatio,
    generateAudio: input?.generateAudio,
    referenceImageUrls,
    referenceVideoUrls,
    referenceAudioUrls,
    firstFrameUrl:
      input?.mode === "image-to-video" ? input.firstFrameUrl : undefined,
    lastFrameUrl:
      input?.mode === "image-to-video" ? input.lastFrameUrl : undefined,
    creditCost: task.creditCost,
    createdAt: task.createdAt,
  };
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function aspectClass(aspectRatio?: string) {
  switch (aspectRatio) {
    case "9:16":
    case "3:4":
      return "aspect-[9/16]";
    case "1:1":
      return "aspect-square";
    case "4:3":
      return "aspect-[4/3]";
    case "21:9":
      return "aspect-[21/9]";
    default:
      return "aspect-video";
  }
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = requireUser();

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const tasks = await getUserCompletedTasksPaginated(user.id, page, PAGE_SIZE);

  const items = tasks.items
    .map(mapTaskToCreation)
    .filter((item): item is CreationItem => item !== null);

  return {
    items,
    currentPage: page,
    totalPages: tasks.totalPages,
    total: tasks.total,
  };
};

export default function CreationsPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { items, currentPage, totalPages } = loaderData;
  const [selected, setSelected] = useState<CreationItem | null>(null);
  const r2Domain = useR2Domain();

  const mediaUrl = (keyOrUrl: string) => {
    if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
      return keyOrUrl;
    }
    return buildR2Url(keyOrUrl, r2Domain);
  };

  const handleDownload = (videoKey: string) => {
    const a = document.createElement("a");
    a.href = mediaUrl(videoKey);
    a.download = videoKey.split("/").pop() || "video.mp4";
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20" />
      <div className="absolute top-0 right-0 h-[800px] w-[800px] rounded-full bg-gradient-radial from-indigo-200/20 via-transparent to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-gradient-radial from-purple-200/20 via-transparent to-transparent blur-3xl" />

      <div className="relative pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1
              className="mb-4 font-bold text-4xl text-slate-900 tracking-tight opacity-0 md:text-5xl"
              style={{ animation: "fade-in-up 0.6s ease-out 0.1s forwards" }}
            >
              {t("creations.title")}
            </h1>
            <p
              className="text-lg text-slate-600 opacity-0"
              style={{ animation: "fade-in-up 0.6s ease-out 0.2s forwards" }}
            >
              {t("creations.description")}
            </p>
          </div>

          {items.length === 0 ? (
            <div
              className="py-24 text-center opacity-0"
              style={{ animation: "fade-in-up 0.6s ease-out 0.3s forwards" }}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Video className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 text-xl">
                {t("creations.emptyTitle")}
              </h3>
              <p className="text-slate-500">
                {t("creations.emptyDescription")}
              </p>
            </div>
          ) : (
            <div
              className="opacity-0"
              style={{ animation: "fade-in-up 0.6s ease-out 0.3s forwards" }}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => (
                  <article
                    className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md"
                    key={item.id}
                    style={{ animationDelay: `${0.3 + index * 0.04}s` }}
                  >
                    <button
                      type="button"
                      className={cn(
                        "relative block w-full overflow-hidden bg-slate-900",
                        aspectClass(item.aspectRatio),
                      )}
                      onClick={() => setSelected(item)}
                      aria-label={t("creations.viewVideo")}
                    >
                      <video
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        muted
                        playsInline
                        preload="metadata"
                        poster={
                          item.posterKey ? mediaUrl(item.posterKey) : undefined
                        }
                        src={mediaUrl(item.videoKey)}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity group-hover:bg-black/30">
                        <div className="rounded-full bg-black/55 p-3 text-white shadow-lg">
                          <Play className="h-6 w-6 fill-current" />
                        </div>
                      </div>
                      <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2.5 py-1 font-medium text-white text-xs shadow-sm backdrop-blur-sm">
                        {MODE_LABELS[item.mode] ?? item.mode}
                      </span>
                    </button>

                    <div className="space-y-3 p-4">
                      <p className="line-clamp-2 text-slate-800 text-sm leading-relaxed">
                        {item.prompt || t("creations.noPrompt")}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs">
                        {item.resolution && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            {item.resolution}
                          </span>
                        )}
                        {typeof item.duration === "number" && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            {item.duration}s
                          </span>
                        )}
                        {item.aspectRatio && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">
                            {item.aspectRatio}
                          </span>
                        )}
                        <span className="ml-auto">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 font-medium text-slate-700 text-xs transition hover:bg-slate-200"
                          onClick={() => setSelected(item)}
                        >
                          <Play className="h-3.5 w-3.5" />
                          {t("creations.viewVideo")}
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-indigo-600 px-3 font-medium text-white text-xs transition hover:bg-indigo-700"
                          onClick={() => handleDownload(item.videoKey)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t("creations.downloadVideo")}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          className={cn(
                            currentPage <= 1 &&
                              "pointer-events-none opacity-50",
                          )}
                          href={
                            currentPage > 1
                              ? `?page=${currentPage - 1}`
                              : undefined
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

                          return (
                            <PaginationItem key={page}>
                              {showEllipsis && (
                                <span className="px-2 text-slate-400">...</span>
                              )}
                              <PaginationLink
                                href={`?page=${page}`}
                                isActive={page === currentPage}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                      <PaginationItem>
                        <PaginationNext
                          className={cn(
                            currentPage >= totalPages &&
                              "pointer-events-none opacity-50",
                          )}
                          href={
                            currentPage < totalPages
                              ? `?page=${currentPage + 1}`
                              : undefined
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => !open && setSelected(null)}
        open={selected !== null}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/80" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <button
                aria-label="Close"
                className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-slate-700 transition-colors hover:bg-black/20"
                onClick={() => setSelected(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>

              {selected && (
                <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
                  <div className="bg-black p-3 sm:p-4">
                    <video
                      autoPlay
                      className="max-h-[70vh] w-full rounded-lg object-contain"
                      controls
                      playsInline
                      poster={
                        selected.posterKey
                          ? mediaUrl(selected.posterKey)
                          : undefined
                      }
                      src={mediaUrl(selected.videoKey)}
                    >
                      <track kind="captions" label="Captions unavailable" />
                    </video>
                  </div>

                  <div className="space-y-5 p-5 sm:p-6">
                    <div>
                      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 text-xs">
                        {MODE_LABELS[selected.mode] ?? selected.mode}
                      </span>
                      <h2 className="mt-3 font-semibold text-lg text-slate-900">
                        {t("creations.detailsTitle")}
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                        {selected.prompt || t("creations.noPrompt")}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      {selected.resolution && (
                        <div>
                          <dt className="text-slate-500 text-xs">
                            {t("creations.resolution")}
                          </dt>
                          <dd className="font-medium text-slate-900">
                            {selected.resolution}
                          </dd>
                        </div>
                      )}
                      {typeof selected.duration === "number" && (
                        <div>
                          <dt className="text-slate-500 text-xs">
                            {t("creations.duration")}
                          </dt>
                          <dd className="font-medium text-slate-900">
                            {selected.duration}s
                          </dd>
                        </div>
                      )}
                      {selected.aspectRatio && (
                        <div>
                          <dt className="text-slate-500 text-xs">
                            {t("creations.aspectRatio")}
                          </dt>
                          <dd className="font-medium text-slate-900">
                            {selected.aspectRatio}
                          </dd>
                        </div>
                      )}
                      {typeof selected.generateAudio === "boolean" && (
                        <div>
                          <dt className="text-slate-500 text-xs">
                            {t("creations.audio")}
                          </dt>
                          <dd className="font-medium text-slate-900">
                            {selected.generateAudio
                              ? t("creations.audioOn")
                              : t("creations.audioOff")}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-slate-500 text-xs">
                          {t("creations.created")}
                        </dt>
                        <dd className="font-medium text-slate-900">
                          {formatRelativeTime(selected.createdAt)}
                        </dd>
                      </div>
                    </dl>

                    {(selected.referenceImageUrls.length > 0 ||
                      selected.referenceVideoUrls.length > 0 ||
                      selected.referenceAudioUrls.length > 0 ||
                      selected.firstFrameUrl) && (
                      <div>
                        <h3 className="mb-2 font-medium text-slate-900 text-sm">
                          {t("creations.references")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selected.firstFrameUrl && (
                            <img
                              alt="First frame"
                              className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                              src={mediaUrl(selected.firstFrameUrl)}
                            />
                          )}
                          {selected.lastFrameUrl && (
                            <img
                              alt="Last frame"
                              className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                              src={mediaUrl(selected.lastFrameUrl)}
                            />
                          )}
                          {selected.referenceImageUrls.map((url) => (
                            <img
                              key={url}
                              alt="Reference"
                              className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                              src={mediaUrl(url)}
                            />
                          ))}
                          {selected.referenceVideoUrls.map((url) => (
                            <div
                              key={url}
                              className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              title={url}
                            >
                              <Video className="h-5 w-5" />
                            </div>
                          ))}
                          {selected.referenceAudioUrls.map((url) => (
                            <div
                              key={url}
                              className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              title={url}
                            >
                              <Music className="h-5 w-5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-indigo-700"
                      onClick={() => handleDownload(selected.videoKey)}
                      type="button"
                    >
                      <Download className="h-5 w-5" />
                      {t("creations.downloadVideo")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
