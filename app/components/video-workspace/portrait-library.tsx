import { Check, Loader2 } from "lucide-react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import type { PortraitAsset } from "./portrait-assets";

export type PortraitItem = PortraitAsset;

export interface PortraitLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (portrait: PortraitAsset) => void;
}

const GENDERS = [
  { value: "all", label: "All" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

const AGES = [
  { value: "all", label: "All" },
  { value: "18-25", label: "18-25" },
  { value: "26-35", label: "26-35" },
  { value: "36-50", label: "36-50" },
  { value: "50+", label: "50+" },
] as const;

const BATCH_SIZE = 80;

export function PortraitLibrary({
  open,
  onOpenChange,
  onSelect,
}: PortraitLibraryProps) {
  const [assets, setAssets] = React.useState<PortraitAsset[] | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [gender, setGender] = React.useState("all");
  const [age, setAge] = React.useState("all");
  const [country, setCountry] = React.useState("all");
  const [visibleCount, setVisibleCount] = React.useState(BATCH_SIZE);

  // Dynamically load portrait assets only when dialog opens
  React.useEffect(() => {
    if (open && !assets) {
      import("./portrait-assets").then((mod) => {
        setAssets(mod.PORTRAIT_ASSETS);
      });
    }
  }, [open, assets]);

  // Reset visible count when filters change
  React.useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [gender, age, country]);

  // IntersectionObserver callback ref for infinite scroll sentinel
  const sentinelRef = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const countryOptions = React.useMemo(() => {
    if (!assets) return [{ value: "all", label: "All" }];
    return [
      { value: "all", label: "All" },
      ...Array.from(new Set(assets.map((p) => p.country)))
        .sort()
        .map((c) => ({ value: c, label: c })),
    ];
  }, [assets]);

  const filtered = React.useMemo(() => {
    if (!assets) return [];
    return assets.filter((p) => {
      if (gender !== "all" && p.gender !== gender) return false;
      if (age !== "all" && !matchesAge(p.age, age)) return false;
      if (country !== "all" && p.country !== country) return false;
      return true;
    });
  }, [assets, gender, age, country]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const isLoading = open && !assets;

  const handleSelect = (item: PortraitAsset) => {
    setSelectedId(item.id);
    onSelect?.(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] w-full max-w-5xl sm:max-w-5xl flex-col overflow-hidden p-0",
          "border bg-card",
          "shadow-[0_20px_60px_rgba(0,0,0,0.7)]",
        )}
      >
        <DialogHeader className="px-4 pt-4 pb-2 text-center sm:px-6 sm:pt-6 sm:text-left">
          <DialogTitle className="font-[system-ui] text-lg font-semibold leading-none tracking-tight">
            Virtual Portrait Library
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-3 border-b px-4 pb-3 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="portrait-gender"
                className="text-[11px] font-medium text-muted-foreground"
              >
                Gender
              </label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger
                  id="portrait-gender"
                  className="flex h-8 w-[120px] items-center justify-between whitespace-nowrap gap-1 rounded-md border-input bg-background px-3 py-2 text-xs shadow-sm ring-offset-background [&>span]:line-clamp-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="portrait-country"
                className="text-[11px] font-medium text-muted-foreground"
              >
                Country
              </label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger
                  id="portrait-country"
                  className="flex h-8 w-[160px] items-center justify-between rounded-md border-input bg-background px-3 text-xs ring-offset-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="portrait-age"
                className="text-[11px] font-medium text-muted-foreground"
              >
                Age
              </label>
              <Select value={age} onValueChange={setAge}>
                <SelectTrigger
                  id="portrait-age"
                  className="flex h-8 w-[120px] items-center justify-between whitespace-nowrap gap-1 rounded-md border-input bg-background px-3 py-2 text-xs shadow-sm ring-offset-background [&>span]:line-clamp-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex items-end pb-1">
              <span className="text-xs text-muted-foreground">
                {isLoading ? "Loading..." : `${filtered.length} portraits`}
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
                {visibleItems.map((item) => {
                  const selected = selectedId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "group relative aspect-[3/4] overflow-hidden rounded-lg bg-muted/80 transition-all",
                        "hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        selected && "ring-2 ring-primary",
                      )}
                      style={{ contentVisibility: "auto" }}
                    >
                      <img
                        src={item.url}
                        alt={`${item.country} ${item.age} years old ${item.gender} ${item.occupation}`}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 sm:p-2">
                        <p className="truncate text-[10px] font-medium text-white sm:text-xs">
                          {item.country}
                        </p>
                        <p className="truncate text-[9px] text-white/70 sm:text-[10px]">
                          {item.age} years old
                        </p>
                      </div>
                      <div
                        className={cn(
                          "absolute inset-0 flex items-center justify-center transition-colors",
                          selected
                            ? "bg-primary/15"
                            : "bg-primary/0 group-hover:bg-primary/10",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full bg-primary/80 text-primary-foreground transition-opacity",
                            selected
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="flex items-center justify-center py-6"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!hasMore && visibleItems.length > 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  All {filtered.length} portraits loaded
                </p>
              )}

              {!isLoading && filtered.length === 0 && (
                <p className="py-20 text-center text-sm text-muted-foreground">
                  No portraits match the current filters.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function matchesAge(age: number, bucket: string) {
  switch (bucket) {
    case "18-25":
      return age >= 18 && age <= 25;
    case "26-35":
      return age >= 26 && age <= 35;
    case "36-50":
      return age >= 36 && age <= 50;
    case "50+":
      return age > 50;
    default:
      return false;
  }
}

export default PortraitLibrary;
