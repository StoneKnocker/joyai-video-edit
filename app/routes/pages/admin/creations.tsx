import { Download, X } from "lucide-react";
import { useState } from "react";
import { useNavigation } from "react-router";
import Header from "~/components/header";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogOverlay, DialogPortal } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getTaskResultMedia } from "~/lib/ai/seedance.shared";
import { TASK_STATUS } from "~/lib/consts";
import {
  getAllUserTasksPaginated,
  getUsersWithTasks,
} from "~/lib/model/userTask";
import { useR2Domain } from "~/lib/public-env";
import { buildR2Url } from "~/lib/r2/r2.shared";
import { cn } from "~/lib/utils";
import { requireAdmin, requireAuth } from "~/middlewares/auth-guard";
import type { Route } from "./+types/creations";

const PAGE_SIZE = 20;

export const middleware = [requireAuth];

export const loader = async ({ request }: Route.LoaderArgs) => {
  requireAdmin();

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const userId = url.searchParams.get("userId") || undefined;
  const emailPrefix = url.searchParams.get("emailPrefix") || undefined;

  const [tasks, users] = await Promise.all([
    getAllUserTasksPaginated(page, PAGE_SIZE, { userId, emailPrefix }),
    getUsersWithTasks(),
  ]);

  return { tasks, users, currentPage: page, userId, emailPrefix };
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [TASK_STATUS.PENDING]: { label: "Pending", variant: "outline" },
  [TASK_STATUS.PROCESSING]: { label: "Processing", variant: "secondary" },
  [TASK_STATUS.COMPLETED]: { label: "Completed", variant: "default" },
  [TASK_STATUS.FAILED]: { label: "Failed", variant: "destructive" },
  [TASK_STATUS.CANCELED]: { label: "Canceled", variant: "outline" },
};

const modeLabels: Record<string, string> = {
  "multi-reference": "Multi Reference",
  "image-to-video": "Image to Video",
  "text-to-video": "Text to Video",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type MediaItem = {
  key: string;
  type: "image" | "video";
  thumbnailKey?: string;
};

function extractMediaItems(resultData: unknown): MediaItem[] {
  const media = getTaskResultMedia(resultData);
  return media.videoKeys.map((key) => ({
    key,
    type: "video" as const,
    thumbnailKey: media.posterKey,
  }));
}

function OwnerInfo({
  item,
}: {
  item: {
    userId: string;
    userName: string | null;
    userEmail: string | null;
  };
}) {
  return (
    <div>
      <div className="text-sm">
        {item.userName || item.userEmail || item.userId}
      </div>
      {item.userEmail && (
        <div className="text-muted-foreground text-xs">{item.userEmail}</div>
      )}
    </div>
  );
}

function Actions({
  item,
  onPreview,
}: {
  item: {
    id: string;
    status: string;
    resultData: unknown;
    errorMessage: string;
  };
  onPreview: (media: MediaItem) => void;
}) {
  if (item.status === TASK_STATUS.COMPLETED) {
    const mediaItems = extractMediaItems(item.resultData);
    const bestItem = mediaItems[0];
    if (!bestItem) {
      return <span className="text-muted-foreground text-sm">No asset</span>;
    }
    return (
      <button
        type="button"
        onClick={() => onPreview(bestItem)}
        className="cursor-pointer text-indigo-600 text-sm hover:underline"
      >
        Preview
      </button>
    );
  }

  if (item.status === TASK_STATUS.FAILED) {
    return (
      <span
        className="max-w-[200px] truncate text-destructive text-xs"
        title={item.errorMessage}
      >
        {item.errorMessage || "Unknown error"}
      </span>
    );
  }

  return <span className="text-muted-foreground text-sm">-</span>;
}

function FilterForm({
  users,
  currentUserId,
  currentEmailPrefix,
}: {
  users: Array<{ userId: string; name: string; email: string }>;
  currentUserId?: string;
  currentEmailPrefix?: string;
}) {
  const navigation = useNavigation();
  const searching = navigation.state === "loading";

  return (
    <form
      id="admin-filter-form"
      method="get"
      className="mb-6 flex flex-wrap gap-4"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="userId" className="font-medium text-sm">
          User
        </label>
        <Select
          defaultValue={currentUserId || "all"}
          onValueChange={(value) => {
            const form = document.getElementById(
              "admin-filter-form",
            ) as HTMLFormElement | null;
            if (form) {
              const input = form.elements.namedItem(
                "userId",
              ) as HTMLInputElement;
              input.value = value === "all" ? "" : value;
              form.requestSubmit();
            }
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.userId} value={u.userId}>
                {u.email} ({u.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="userId" value={currentUserId || ""} />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="emailPrefix" className="font-medium text-sm">
          Email
        </label>
        <Input
          id="emailPrefix"
          name="emailPrefix"
          placeholder="Prefix search..."
          defaultValue={currentEmailPrefix || ""}
          className="w-[200px]"
        />
      </div>

      <button
        type="submit"
        disabled={searching}
        className="inline-flex h-9 items-center rounded-md bg-indigo-600 px-4 font-medium text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Filter
      </button>

      {(currentUserId || currentEmailPrefix) && (
        <a
          href="?"
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-slate-50"
        >
          Clear
        </a>
      )}
    </form>
  );
}

export default function AdminCreationsPage({
  loaderData,
}: Route.ComponentProps) {
  const { tasks, users, currentPage, userId, emailPrefix } = loaderData;
  const { totalPages, items } = tasks;
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const r2Domain = useR2Domain();

  return (
    <div className="landing-theme min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 font-bold text-3xl text-slate-900">
          All Creations
        </h1>

        <FilterForm
          users={users}
          currentUserId={userId}
          currentEmailPrefix={emailPrefix}
        />

        {items.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            No tasks found.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">
                      Created
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Owner
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Prompt
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Mode
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Model
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Task ID
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const st = statusConfig[item.status] || {
                      label: item.status,
                      variant: "outline" as const,
                    };
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-slate-600 text-sm">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <OwnerInfo item={item} />
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate text-sm"
                          title={item.prompt ?? ""}
                        >
                          {item.prompt || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm">
                          {modeLabels[item.mode] ?? item.mode}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm">
                          {item.model || "-"}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate font-mono text-xs">
                          {item.id}
                        </TableCell>
                        <TableCell>
                          <Actions item={item} onPreview={setPreviewMedia} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={buildPageUrl({
                          page: currentPage - 1,
                          userId,
                          emailPrefix,
                          disabled: currentPage <= 1,
                        })}
                        className={cn(
                          currentPage <= 1 && "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>

                    {paginateRange(currentPage, totalPages).map(
                      (page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && page - prev > 1;

                        return (
                          <PaginationItem key={page}>
                            {showEllipsis && (
                              <span className="px-2 text-slate-400">...</span>
                            )}
                            <PaginationLink
                              href={buildPageUrl({
                                page,
                                userId,
                                emailPrefix,
                              })}
                              isActive={page === currentPage}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      },
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href={buildPageUrl({
                          page: currentPage + 1,
                          userId,
                          emailPrefix,
                          disabled: currentPage >= totalPages,
                        })}
                        className={cn(
                          currentPage >= totalPages &&
                            "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      <MediaPreviewDialog
        key={previewMedia?.key}
        media={previewMedia}
        r2Domain={r2Domain}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  );
}

function MediaPreviewDialog({
  media,
  r2Domain,
  onClose,
}: {
  media: MediaItem | null;
  r2Domain: string;
  onClose: () => void;
}) {
  if (!media) return null;

  const url = buildR2Url(media.key, r2Domain);
  const thumbnailUrl = media.thumbnailKey
    ? buildR2Url(media.thumbnailKey, r2Domain)
    : null;

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              aria-label="Close"
              className="-top-12 absolute right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            {media.type === "video" ? (
              <video
                autoPlay
                className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
                controls
                playsInline
                src={url}
              >
                <track kind="captions" label="Captions unavailable" />
              </video>
            ) : (
              <img
                alt="Preview"
                className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
                src={thumbnailUrl || url}
              />
            )}

            <div className="mt-4 flex justify-center gap-4">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-slate-900 shadow-lg transition-transform hover:scale-105"
                download
              >
                <Download className="h-5 w-5" />
                Download
              </a>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

function buildPageUrl({
  page,
  userId,
  emailPrefix,
  disabled,
}: {
  page: number;
  userId?: string;
  emailPrefix?: string;
  disabled?: boolean;
}) {
  if (disabled) return undefined;

  const params = new URLSearchParams();
  params.set("page", String(page));
  if (userId) params.set("userId", userId);
  if (emailPrefix) params.set("emailPrefix", emailPrefix);
  return `?${params.toString()}`;
}

function paginateRange(current: number, total: number): number[] {
  return Array.from({ length: total }, (_, i) => i + 1).filter((page) => {
    return page === 1 || page === total || Math.abs(page - current) <= 1;
  });
}
