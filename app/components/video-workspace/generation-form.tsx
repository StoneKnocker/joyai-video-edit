import {
  FileText,
  Image,
  Layers,
  Loader2,
  Music,
  Plus,
  Sparkles,
  Type,
  Upload,
  UserRound,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import * as React from "react";
import { Switch } from "~/components/ui/switch";
import { useAuth } from "~/hooks/use-auth";
import { useLoginModal } from "~/hooks/use-login-modal";
import { usePricingModal } from "~/hooks/use-pricing-modal";
import { generateUploadFilePath, uploadToR2 } from "~/lib/r2/r2.client";
import { getTrpcErrorMessage } from "~/lib/trpc/error";
import { trpc } from "~/lib/trpc/trpc-provider";
import { cn } from "~/lib/utils";
import { getTaskResultMedia } from "~/lib/ai/seedance.shared";
import { useR2Domain } from "~/lib/public-env";
import { buildR2Url } from "~/lib/r2/r2.shared";
import {
  addPortraitAsset as addPortraitAssetToState,
  type FrameSlot,
  getFrameAsset,
  getI2vFrameUrls,
  getImageAssets,
  getPendingAssetsForGeneration,
  getSuccessfulUrls,
  mapAssetsForEndFrameToggle,
  type MediaKind,
  mergeUploadedUrls,
  removeAssetById,
  replaceFrameAsset,
  type UploadedAsset,
} from "./asset-state";
import {
  ASSET_LIMITS,
  MAX_REFERENCE_MEDIA_DURATION_SECONDS,
  readMediaDurationSeconds,
  validateMediaFile,
} from "./media-validation";
import type { PortraitItem } from "./portrait-library";
import { PortraitLibrary } from "./portrait-library";
import { SettingsPanel } from "./settings-panel";
import type { GenerationTab, WorkspaceTaskState } from "./workspace-types";

type Resolution = "480p" | "720p" | "1080p" | "4K";
type ApiResolution = "480p" | "720p" | "1080p" | "4k";
type ApiAspectRatio =
  | "adaptive"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "21:9"
  | "1:1";

interface GenerationFormProps {
  activeTab?: GenerationTab;
  onTabChange?: (tab: GenerationTab) => void;
  onTaskStateChange?: (state: WorkspaceTaskState) => void;
}

const TABS: { id: GenerationTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "multi-reference",
    label: "Multi Reference",
    icon: <WandSparkles className="h-3.5 w-3.5 shrink-0" />,
  },
  {
    id: "image-to-video",
    label: "Image to Video",
    icon: <Image className="h-3.5 w-3.5 shrink-0" />,
  },
  {
    id: "text-to-video",
    label: "Text to Video",
    icon: <Type className="h-3.5 w-3.5 shrink-0" />,
  },
];

const PROMPT_PLACEHOLDERS: Record<GenerationTab, string> = {
  "multi-reference":
    "Type @ to reference uploaded materials, e.g. @Image1 as first frame...",
  "image-to-video": "Describe how you want your image to animate...",
  "text-to-video": "Describe the video you want to generate...",
};

function toApiResolution(resolution: Resolution): ApiResolution {
  return resolution === "4K" ? "4k" : resolution;
}

function toApiAspectRatio(aspectRatio: string): ApiAspectRatio {
  if (aspectRatio === "Auto") return "adaptive";
  return aspectRatio as ApiAspectRatio;
}

export function GenerationForm({
  activeTab: controlledActiveTab,
  onTabChange,
  onTaskStateChange,
}: GenerationFormProps) {
  const [internalTab, setInternalTab] =
    React.useState<GenerationTab>("multi-reference");
  const activeTab = controlledActiveTab ?? internalTab;
  const { user, isAuthenticated } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { openPricingModal } = usePricingModal();
  const utils = trpc.useUtils();
  const r2Domain = useR2Domain();

  const toMediaUrl = React.useCallback(
    (keyOrUrl: string) => {
      if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
        return keyOrUrl;
      }
      return buildR2Url(keyOrUrl, r2Domain);
    },
    [r2Domain],
  );

  const [prompt, setPrompt] = React.useState("");
  const [resolution, setResolution] = React.useState<Resolution>("1080p");
  const [duration, setDuration] = React.useState(5);
  const [aspectRatio, setAspectRatio] = React.useState("Auto");
  const [generateAudio, setGenerateAudio] = React.useState(true);
  const [addEndFrame, setAddEndFrame] = React.useState(false);
  const [assets, setAssets] = React.useState<UploadedAsset[]>([]);
  const [formError, setFormError] = React.useState("");
  const [currentTaskId, setCurrentTaskId] = React.useState<string | null>(null);
  const [portraitLibraryOpen, setPortraitLibraryOpen] = React.useState(false);
  const [selectedPortrait, setSelectedPortrait] =
    React.useState<PortraitItem | null>(null);
  const pendingFilesRef = React.useRef<Map<string, File>>(new Map());

  const getPresignedUrlMutation = trpc.r2.getPresignedUrl.useMutation();
  const creditsQuery = trpc.user.getCredits.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createTaskMutation = trpc.video.createSeedanceTask.useMutation();
  const taskStatusQuery = trpc.video.getTaskStatus.useQuery(
    { taskId: currentTaskId ?? "" },
    {
      enabled: Boolean(currentTaskId),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "completed" || status === "failed" ? false : 5000;
      },
    },
  );

  // Only multi-reference mode can attach reference videos for KIE with-video pricing.
  const referenceVideoAssets = React.useMemo(
    () =>
      activeTab === "multi-reference"
        ? assets.filter(
            (asset) =>
              asset.kind === "video" &&
              (asset.status === "pending" ||
                asset.status === "uploading" ||
                asset.status === "success"),
          )
        : [],
    [activeTab, assets],
  );
  const hasReferenceVideo = referenceVideoAssets.length > 0;
  const referenceVideoDurationSeconds = React.useMemo(() => {
    const total = referenceVideoAssets.reduce(
      (sum, asset) => sum + (asset.durationSeconds ?? 0),
      0,
    );
    return Math.min(total, MAX_REFERENCE_MEDIA_DURATION_SECONDS);
  }, [referenceVideoAssets]);

  const creditCostQuery = trpc.video.getCreditsForSettings.useQuery(
    {
      resolution: toApiResolution(resolution),
      duration,
      hasReferenceVideo,
      ...(hasReferenceVideo ? { referenceVideoDurationSeconds } : {}),
    },
    { enabled: isAuthenticated },
  );

  React.useEffect(() => {
    const data = taskStatusQuery.data;
    if (!data) return;

    const media = getTaskResultMedia(data.resultData);
    const videoKeys =
      data.videoKeys?.length > 0 ? data.videoKeys : media.videoKeys;
    onTaskStateChange?.({
      taskId: data.taskId,
      status:
        data.status === "completed"
          ? "completed"
          : data.status === "failed"
            ? "failed"
            : data.status === "pending"
              ? "pending"
              : "processing",
      videoUrls: videoKeys.map(toMediaUrl),
      imageUrls: media.imageKeys.map(toMediaUrl),
      errorMessage: data.errorMessage,
    });

    if (data.status === "completed" || data.status === "failed") {
      utils.user.getCredits.invalidate();
    }
  }, [
    taskStatusQuery.data,
    onTaskStateChange,
    toMediaUrl,
    utils.user.getCredits,
  ]);

  const handleTabChange = (tab: GenerationTab) => {
    setFormError("");
    if (controlledActiveTab === undefined) {
      setInternalTab(tab);
    }
    onTabChange?.(tab);
  };

  const removeAsset = (id: string) => {
    pendingFilesRef.current.delete(id);
    setAssets((current) => {
      const result = removeAssetById({
        assets: current,
        id,
        selectedPortrait,
      });
      if (result.previewUrlToRevoke) {
        URL.revokeObjectURL(result.previewUrlToRevoke);
      }
      setSelectedPortrait(result.selectedPortrait);
      return result.assets;
    });
  };

  const selectFiles = (files: FileList | null, kind: MediaKind) => {
    if (!files || files.length === 0) return;

    const limit = ASSET_LIMITS[kind];
    const existingCount = assets.filter((asset) => asset.kind === kind).length;
    const selectedFiles = Array.from(files).slice(
      0,
      Math.max(0, limit.maxFiles - existingCount),
    );

    if (selectedFiles.length !== files.length) {
      setFormError(`You can upload up to ${limit.maxFiles} ${kind} files.`);
    }

    void (async () => {
      for (const file of selectedFiles) {
        const formatError = validateMediaFile(file, kind);
        if (formatError) {
          setFormError(formatError);
          continue;
        }

        let durationSeconds: number | undefined;
        if (kind === "video" || kind === "audio") {
          durationSeconds = await readMediaDurationSeconds(file);
        }

        const id = crypto.randomUUID();
        const previewUrl =
          kind === "image" ? URL.createObjectURL(file) : undefined;
        pendingFilesRef.current.set(id, file);
        setAssets((current) => {
          if (
            (kind === "video" || kind === "audio") &&
            durationSeconds != null &&
            durationSeconds > 0
          ) {
            const existingDuration = current
              .filter((asset) => asset.kind === kind)
              .reduce((sum, asset) => sum + (asset.durationSeconds ?? 0), 0);
            if (
              existingDuration + durationSeconds >
              MAX_REFERENCE_MEDIA_DURATION_SECONDS
            ) {
              setFormError(
                `Total ${kind} duration must be ≤ ${MAX_REFERENCE_MEDIA_DURATION_SECONDS}s.`,
              );
              pendingFilesRef.current.delete(id);
              return current;
            }
          }

          return [
            ...current,
            {
              id,
              name: file.name,
              url: "",
              kind,
              progress: 0,
              status: "pending" as const,
              previewUrl,
              ...(durationSeconds != null && durationSeconds > 0
                ? { durationSeconds }
                : {}),
            },
          ];
        });
      }
    })();
  };

  /**
   * Upload pending files and return id→url map so callers can build the
   * task input without waiting for React state to re-render.
   */
  const uploadPendingAssets = async (
    pendingAssets: UploadedAsset[],
  ): Promise<{ ok: boolean; uploadedUrls: Map<string, string> }> => {
    const uploadedUrls = new Map<string, string>();
    if (pendingAssets.length === 0) {
      return { ok: true, uploadedUrls };
    }

    let hasError = false;

    await Promise.all(
      pendingAssets.map(async (asset) => {
        const file = pendingFilesRef.current.get(asset.id);
        if (!file || !user?.id) {
          hasError = true;
          return;
        }

        setAssets((current) =>
          current.map((a) =>
            a.id === asset.id ? { ...a, status: "uploading" } : a,
          ),
        );

        const filePath = generateUploadFilePath(user.id, file.name);
        try {
          const { uploadUrl } = await getPresignedUrlMutation.mutateAsync({
            filePath,
            contentType: file.type || "application/octet-stream",
          });
          const url = await uploadToR2({
            filePath,
            contentType: file.type || "application/octet-stream",
            file,
            uploadUrl,
            onProgress: (progress) => {
              setAssets((current) =>
                current.map((a) =>
                  a.id === asset.id
                    ? { ...a, progress: progress.percentage }
                    : a,
                ),
              );
            },
          });
          pendingFilesRef.current.delete(asset.id);
          uploadedUrls.set(asset.id, url);
          setAssets((current) =>
            current.map((a) =>
              a.id === asset.id
                ? { ...a, status: "success", progress: 100, url }
                : a,
            ),
          );
        } catch (error) {
          hasError = true;
          setAssets((current) =>
            current.map((a) =>
              a.id === asset.id
                ? {
                    ...a,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : a,
            ),
          );
        }
      }),
    );

    return { ok: !hasError, uploadedUrls };
  };

  const addPortraitAsset = (portrait: PortraitItem) => {
    setAssets((current) => {
      if (activeTab === "image-to-video" && addEndFrame) {
        // Prefer empty slot; when both are set, replace the first frame.
        const slot: FrameSlot = !getFrameAsset(current, "first")
          ? "first"
          : !getFrameAsset(current, "last")
            ? "last"
            : "first";

        const result = replaceFrameAsset({
          assets: current,
          slot,
          nextAsset: {
            id: `portrait:${portrait.id}`,
            name: `${portrait.country} ${portrait.age} ${portrait.occupation}`,
            url: portrait.url,
            kind: "image",
            progress: 100,
            status: "success",
            previewUrl: portrait.url,
            frameSlot: slot,
          },
        });
        if (result.previewUrlToRevoke) {
          URL.revokeObjectURL(result.previewUrlToRevoke);
        }
        setSelectedPortrait(portrait);
        return result.assets;
      }

      const result = addPortraitAssetToState({
        assets: current,
        portrait,
        selectedPortrait,
        maxImageFiles: ASSET_LIMITS.image.maxFiles,
      });
      setSelectedPortrait(result.selectedPortrait);
      if (result.error) {
        setFormError(result.error);
      }
      return result.assets;
    });
  };

  const validateAndBuildInput = (resolvedAssets: UploadedAsset[]) => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 3) {
      throw new Error("Prompt must be at least 3 characters.");
    }

    const base = {
      prompt: trimmedPrompt,
      resolution: toApiResolution(resolution),
      aspectRatio: toApiAspectRatio(aspectRatio),
      duration,
      generateAudio,
    };

    if (activeTab === "text-to-video") {
      return { ...base, mode: "text-to-video" as const };
    }

    if (activeTab === "image-to-video") {
      if (addEndFrame) {
        const { firstFrameUrl, lastFrameUrl } = getI2vFrameUrls(
          resolvedAssets,
          true,
        );
        if (!firstFrameUrl) {
          throw new Error("Upload a first frame image.");
        }
        if (!lastFrameUrl) {
          throw new Error("Upload a last frame image.");
        }
        return {
          ...base,
          mode: "image-to-video" as const,
          firstFrameUrl,
          lastFrameUrl,
        };
      }

      // End frame off: multi-upload — every successful image participates (none dropped).
      // 1 image → classic I2V first-frame; 2+ → multi-reference so all images are used.
      const referenceImageUrls = getSuccessfulUrls(resolvedAssets, "image");
      if (referenceImageUrls.length === 0) {
        throw new Error("Upload at least one image.");
      }
      if (referenceImageUrls.length === 1) {
        return {
          ...base,
          mode: "image-to-video" as const,
          firstFrameUrl: referenceImageUrls[0]!,
        };
      }
      return {
        ...base,
        mode: "multi-reference" as const,
        referenceImageUrls,
      };
    }

    const referenceImageUrls = getSuccessfulUrls(resolvedAssets, "image");
    const referenceVideoUrls = getSuccessfulUrls(resolvedAssets, "video");
    const referenceAudioUrls = getSuccessfulUrls(resolvedAssets, "audio");
    if (referenceImageUrls.length + referenceVideoUrls.length === 0) {
      throw new Error("Upload at least one image or video reference.");
    }

    const referenceVideoDurationSeconds = Math.min(
      resolvedAssets
        .filter(
          (asset) =>
            asset.kind === "video" &&
            asset.status === "success" &&
            asset.url.length > 0,
        )
        .reduce((sum, asset) => sum + (asset.durationSeconds ?? 0), 0),
      MAX_REFERENCE_MEDIA_DURATION_SECONDS,
    );

    return {
      ...base,
      mode: "multi-reference" as const,
      ...(referenceImageUrls.length > 0 ? { referenceImageUrls } : {}),
      ...(referenceVideoUrls.length > 0
        ? {
            referenceVideoUrls,
            ...(referenceVideoDurationSeconds > 0
              ? { referenceVideoDurationSeconds }
              : {}),
          }
        : {}),
      ...(referenceAudioUrls.length > 0 ? { referenceAudioUrls } : {}),
    };
  };

  const handleGenerate = async () => {
    setFormError("");
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    const estimatedCost = creditCostQuery.data?.creditCost ?? 0;
    const balance = creditsQuery.data?.total ?? 0;
    if (estimatedCost > 0 && balance < estimatedCost) {
      openPricingModal();
      return;
    }

    try {
      const { ok, uploadedUrls } = await uploadPendingAssets(
        getPendingAssetsForGeneration({
          assets,
          activeTab,
          addEndFrame,
        }),
      );
      if (!ok) {
        throw new Error("Some files failed to upload.");
      }

      // Use merge of current assets + just-uploaded URLs (not stale React state).
      const resolvedAssets = mergeUploadedUrls(assets, uploadedUrls);
      const input = validateAndBuildInput(resolvedAssets);
      onTaskStateChange?.({
        status: "pending",
        videoUrls: [],
        imageUrls: [],
      });
      const result = await createTaskMutation.mutateAsync(input);
      setCurrentTaskId(result.taskId);
      onTaskStateChange?.({
        taskId: result.taskId,
        status: "processing",
        videoUrls: [],
        imageUrls: [],
      });
      utils.user.getCredits.invalidate();
    } catch (error) {
      const message = getTrpcErrorMessage(error, "Generation failed.");
      setFormError(message);
      onTaskStateChange?.({
        status: "failed",
        videoUrls: [],
        imageUrls: [],
        errorMessage: message,
      });
    }
  };

  const handleAddEndFrameChange = (checked: boolean) => {
    setAddEndFrame(checked);
    setAssets((current) =>
      mapAssetsForEndFrameToggle({ assets: current, addEndFrame: checked }),
    );
  };

  const selectFrameFile = (slot: FrameSlot, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const formatError = validateMediaFile(file, "image");
    if (formatError) {
      setFormError(formatError);
      return;
    }

    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    pendingFilesRef.current.set(id, file);

    setAssets((current) => {
      const result = replaceFrameAsset({
        assets: current,
        slot,
        nextAsset: {
          id,
          name: file.name,
          url: "",
          kind: "image",
          progress: 0,
          status: "pending",
          previewUrl,
          frameSlot: slot,
        },
      });
      if (result.previewUrlToRevoke) {
        URL.revokeObjectURL(result.previewUrlToRevoke);
        // Drop the replaced pending file if it was local-only.
        const previous = getFrameAsset(current, slot);
        if (previous) {
          pendingFilesRef.current.delete(previous.id);
        }
      }
      return result.assets;
    });
  };

  const isUploading = assets.some((asset) => asset.status === "uploading");
  const isCreatingTask = createTaskMutation.isPending;
  // currentTaskId stays set after completion; only treat in-flight statuses as busy.
  const taskStatus = taskStatusQuery.data?.status;
  const isPolling =
    Boolean(currentTaskId) &&
    taskStatus !== "completed" &&
    taskStatus !== "failed";
  const isProcessing = isCreatingTask || isUploading || isPolling;
  const generateLabel = isUploading
    ? "Uploading files"
    : isCreatingTask
      ? "Creating task"
      : isPolling
        ? "Generating"
        : "Generate";
  const estimatedCost = creditCostQuery.data?.creditCost ?? null;
  const balance = creditsQuery.data?.total;
  const imageAssets = getImageAssets(assets);
  const firstFrameAsset = getFrameAsset(assets, "first");
  const lastFrameAsset = getFrameAsset(assets, "last");

  return (
    <div
      className={cn(
        "flex h-fit shrink-0 flex-col gap-5",
        "w-full lg:w-[450px] xl:w-[500px]",
      )}
    >
      <div className="flex w-full rounded-lg border border-border/50 bg-secondary/70 p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={isProcessing}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2.5 font-medium text-xs leading-4 transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                isProcessing && "pointer-events-none opacity-60",
              )}
            >
              {tab.icon}
              <span className="min-w-0 text-center leading-tight [overflow-wrap:anywhere]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
          <Layers className="h-4 w-4" />
          AI Model
        </label>
        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm shadow-sm">
          <img
            src="/logo.png"
            alt="Seedance 2.0"
            className="h-7 w-7 object-contain"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                Seedance 2.0
              </span>
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 font-medium text-[10px]">
                With Audio
              </span>
            </div>
            <p className="truncate text-[10px] text-muted-foreground">
              bytedance/seedance-2
            </p>
          </div>
        </div>
      </div>

      {activeTab === "multi-reference" && (
        <div className="flex flex-col gap-4">
          <PortraitLibrary
            open={portraitLibraryOpen}
            onOpenChange={setPortraitLibraryOpen}
            onSelect={addPortraitAsset}
          />
          <UploadSlot
            assets={assets.filter((asset) => asset.kind === "image")}
            icon={<Upload className="h-6 w-6 text-primary" />}
            kind="image"
            label="Reference Images"
            limitText="jpeg/png/webp/bmp/tiff/gif · max 9 · 20MB"
            disabled={isProcessing}
            secondaryAction={{
              label: "Select Virtual Portrait",
              icon: <UserRound className="h-3.5 w-3.5" />,
              onClick: () => setPortraitLibraryOpen(true),
            }}
            onFilesSelected={selectFiles}
            onRemove={removeAsset}
          />
          <UploadSlot
            assets={assets.filter((asset) => asset.kind === "video")}
            icon={<Upload className="h-6 w-6 text-primary" />}
            kind="video"
            label="Reference Videos"
            limitText="mp4/mov · max 3 · 50MB · 2–15s each"
            disabled={isProcessing}
            onFilesSelected={selectFiles}
            onRemove={removeAsset}
          />
          <UploadSlot
            assets={assets.filter((asset) => asset.kind === "audio")}
            icon={<Upload className="h-6 w-6 text-primary" />}
            kind="audio"
            label="Reference Audios"
            limitText="wav/mp3 · max 3 · 15MB · 2–15s each"
            disabled={isProcessing}
            onFilesSelected={selectFiles}
            onRemove={removeAsset}
          />
        </div>
      )}

      {activeTab === "image-to-video" && (
        <div className="flex flex-col gap-3">
          <PortraitLibrary
            open={portraitLibraryOpen}
            onOpenChange={setPortraitLibraryOpen}
            onSelect={addPortraitAsset}
          />

          <div className={addEndFrame ? "space-y-4" : "space-y-3"}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-foreground text-sm">
                <Image className="h-4 w-4" />
                Images
              </span>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center gap-1",
                    isProcessing && "pointer-events-none opacity-60",
                  )}
                >
                  <span className="whitespace-nowrap text-muted-foreground text-xs">
                    Add end frame
                  </span>
                  <Switch
                    checked={addEndFrame}
                    onCheckedChange={handleAddEndFrameChange}
                    className={cn(
                      "scale-75",
                      addEndFrame ? "bg-primary" : "bg-zinc-600",
                    )}
                  />
                </div>
                {!addEndFrame && (
                  <span className="text-muted-foreground text-sm">
                    {imageAssets.length}/{ASSET_LIMITS.image.maxFiles}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setPortraitLibraryOpen(true)}
              className={cn(
                "inline-flex h-8 w-fit items-center gap-1.5 rounded-md px-2 text-xs",
                "bg-primary/10 text-primary transition-colors hover:bg-primary/15",
                isProcessing && "pointer-events-none opacity-60",
              )}
            >
              <UserRound className="h-3.5 w-3.5" />
              Select Virtual Portrait
            </button>

            {addEndFrame ? (
              <div className="flex items-center gap-3">
                <FrameUploadSlot
                  label="Upload First Frame"
                  asset={firstFrameAsset}
                  disabled={isProcessing}
                  onFilesSelected={(files) => selectFrameFile("first", files)}
                  onRemove={() =>
                    firstFrameAsset && removeAsset(firstFrameAsset.id)
                  }
                />
                <div className="flex-shrink-0 text-muted-foreground">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
                <FrameUploadSlot
                  label="Upload Last Frame"
                  asset={lastFrameAsset}
                  disabled={isProcessing}
                  onFilesSelected={(files) => selectFrameFile("last", files)}
                  onRemove={() =>
                    lastFrameAsset && removeAsset(lastFrameAsset.id)
                  }
                />
              </div>
            ) : (
              <I2vSingleUpload
                assets={imageAssets}
                disabled={isProcessing}
                onFilesSelected={(files) => selectFiles(files, "image")}
                onRemove={removeAsset}
              />
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-[140px] w-full flex-1 flex-col space-y-2">
        <label className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
          <FileText className="h-4 w-4" />
          Prompt
        </label>
        <div className="relative flex-1">
          <textarea
            className={cn(
              "flex h-full min-h-[150px] w-full resize-none rounded-xl border p-4",
              "border-border/50 bg-background/50 shadow-sm backdrop-blur-sm",
              "text-base text-foreground md:text-sm",
              "placeholder:text-muted-foreground",
              "transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20",
            )}
            placeholder={PROMPT_PLACEHOLDERS[activeTab]}
            maxLength={20_000}
            rows={4}
            disabled={isProcessing}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="absolute right-3 bottom-3 rounded-full border-border/50 bg-background/80 px-2 py-0.5 font-mono text-muted-foreground text-xs">
            {prompt.length}/20000
          </div>
        </div>
      </div>

      <SettingsPanel
        resolution={resolution}
        onResolutionChange={(val) => setResolution(val as Resolution)}
        duration={duration}
        onDurationChange={setDuration}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        disabled={isProcessing}
      />

      <label
        className={cn(
          "flex items-center justify-between rounded-lg border border-border/50 bg-background/30 px-4 py-3 text-sm",
          isProcessing && "pointer-events-none opacity-60",
        )}
      >
        <span className="flex items-center gap-2 font-medium">
          <Music className="h-4 w-4 text-primary" />
          Generate audio
        </span>
        <Switch checked={generateAudio} onCheckedChange={setGenerateAudio} />
      </label>

      <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Estimated cost</span>
        <span className="font-semibold">
          {estimatedCost ?? "--"} credits
          {typeof balance === "number" && (
            <span className="ml-2 font-normal text-muted-foreground">
              Balance {balance}
            </span>
          )}
        </span>
      </div>

      {formError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
          {formError}
        </p>
      )}

      <button
        type="button"
        disabled={isProcessing}
        onClick={handleGenerate}
        className={cn(
          "group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4",
          "bg-primary font-semibold text-base text-primary-foreground leading-6 transition-all duration-300",
          "hover:brightness-110 disabled:pointer-events-none disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <span className="relative flex items-center justify-center gap-2">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 fill-primary-foreground/30" />
          )}
          {generateLabel}
        </span>
      </button>
    </div>
  );
}

function FrameUploadSlot({
  label,
  asset,
  disabled,
  onFilesSelected,
  onRemove,
}: {
  label: string;
  asset?: UploadedAsset;
  disabled?: boolean;
  onFilesSelected: (files: FileList | null) => void;
  onRemove: () => void;
}) {
  const inputId = React.useId();

  if (asset) {
    return (
      <div className="relative h-[140px] min-w-0 max-w-[200px] flex-1 overflow-hidden rounded-xl border-2 border-border/50">
        {asset.previewUrl ? (
          <img
            src={asset.previewUrl}
            alt={asset.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-background/80 px-2 py-1 backdrop-blur-sm">
          <p className="truncate text-[10px] text-foreground">{asset.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {asset.status === "uploading"
              ? `${asset.progress}%`
              : asset.status === "pending"
                ? "ready"
                : asset.status}
          </p>
        </div>
        <button
          type="button"
          aria-label="Remove frame"
          disabled={disabled}
          onClick={onRemove}
          className={cn(
            "absolute top-1.5 right-1.5 rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur-sm hover:bg-muted hover:text-foreground",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-[200px] flex-1">
      <label
        htmlFor={inputId}
        className={cn(
          "relative flex h-[140px] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-4 text-center",
          "border-muted-foreground/25 transition-all duration-300 ease-in-out",
          "hover:border-primary/60 hover:bg-primary/5",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept={ASSET_LIMITS.image.accept}
          disabled={disabled}
          onChange={(event) => {
            onFilesSelected(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/15 p-2">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium text-muted-foreground text-xs">{label}</p>
        </div>
      </label>
    </div>
  );
}

function I2vSingleUpload({
  assets,
  disabled,
  onFilesSelected,
  onRemove,
}: {
  assets: UploadedAsset[];
  disabled?: boolean;
  onFilesSelected: (files: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  const inputId = React.useId();
  const remaining = Math.max(0, ASSET_LIMITS.image.maxFiles - assets.length);

  return (
    <div>
      {assets.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-2 py-2"
            >
              {asset.previewUrl ? (
                <img
                  src={asset.previewUrl}
                  alt=""
                  className="h-9 w-9 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <Image className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">{asset.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {asset.status === "uploading"
                    ? `${asset.progress}%`
                    : asset.status === "pending"
                      ? "ready"
                      : asset.status}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove file"
                disabled={disabled}
                onClick={() => onRemove(asset.id)}
                className={cn(
                  "rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        htmlFor={inputId}
        className={cn(
          "relative flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10",
          "border-muted-foreground/30 bg-transparent transition-all duration-300 ease-in-out",
          "hover:border-muted-foreground/50 hover:bg-muted/30",
          disabled && "pointer-events-none opacity-60",
          remaining === 0 && "pointer-events-none opacity-50",
        )}
      >
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept={ASSET_LIMITS.image.accept}
          multiple
          disabled={disabled || remaining === 0}
          onChange={(event) => {
            onFilesSelected(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <div className="mb-3 rounded-full bg-primary/20 p-3 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <p className="mb-1 font-medium text-foreground text-sm">
          Click to upload or drag & drop
        </p>
        <p className="text-muted-foreground text-xs">
          jpeg, jpg, png, webp, bmp, tiff, tif, gif ({remaining} remaining)
        </p>
      </label>
    </div>
  );
}

function UploadSlot({
  assets,
  icon,
  kind,
  label,
  limitText,
  onFilesSelected,
  onRemove,
  secondaryAction,
  disabled,
}: {
  assets: UploadedAsset[];
  icon: React.ReactNode;
  kind: MediaKind;
  label: string;
  limitText: string;
  onFilesSelected: (files: FileList | null, kind: MediaKind) => void;
  onRemove: (id: string) => void;
  secondaryAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  disabled?: boolean;
}) {
  const inputId = React.useId();
  const limit = ASSET_LIMITS[kind];

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium text-foreground text-sm">
          {kind === "image" ? (
            <Image className="h-4 w-4" />
          ) : kind === "video" ? (
            <Video className="h-4 w-4" />
          ) : (
            <Music className="h-4 w-4" />
          )}
          {label}
        </span>
        <span className="text-muted-foreground text-xs">
          {assets.length} / {limit.maxFiles}
        </span>
      </div>
      {secondaryAction && (
        <button
          type="button"
          disabled={disabled}
          onClick={secondaryAction.onClick}
          className={cn(
            "mt-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs",
            "bg-primary/10 text-primary transition-colors hover:bg-primary/15",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          {secondaryAction.icon}
          {secondaryAction.label}
        </button>
      )}

      {assets.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-2 py-2"
            >
              {asset.previewUrl ? (
                <img
                  src={asset.previewUrl}
                  alt=""
                  className="h-9 w-9 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  {kind === "video" ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <Music className="h-4 w-4" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">{asset.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {asset.status === "uploading"
                    ? `${asset.progress}%`
                    : asset.status === "pending"
                      ? "ready"
                      : asset.status}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove file"
                disabled={disabled}
                onClick={() => onRemove(asset.id)}
                className={cn(
                  "rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        htmlFor={inputId}
        className={cn(
          "relative mt-2.5 flex h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-xl",
          "border-2 border-muted-foreground/25 border-dashed bg-transparent py-8",
          "transition-colors hover:border-muted-foreground/40 hover:bg-muted/50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept={limit.accept}
          multiple
          disabled={disabled}
          onChange={(event) => {
            onFilesSelected(event.target.files, kind);
            event.currentTarget.value = "";
          }}
        />
        <div className="mb-3 rounded-full bg-primary/20 p-3 text-primary">
          {icon}
        </div>
        <p className="mb-1 font-medium text-foreground text-sm">
          Click to upload {kind}s
        </p>
        <p className="text-muted-foreground text-xs">{limitText}</p>
      </label>
    </div>
  );
}

export default GenerationForm;
