import { Clock, Monitor, Video, WandSparkles } from "lucide-react";
import type * as React from "react";
import { Slider } from "~/components/ui/slider";
import { cn } from "~/lib/utils";

interface SettingsPanelProps {
  resolution: "480p" | "720p" | "1080p" | "4K";
  onResolutionChange: (val: string) => void;
  duration: number;
  onDurationChange: (val: number) => void;
  aspectRatio: string;
  onAspectRatioChange: (val: string) => void;
  disabled?: boolean;
}

const RESOLUTIONS = ["480p", "720p", "1080p", "4K"] as const;

const ASPECT_RATIOS = [
  { value: "Auto", type: "icon" as const },
  { value: "16:9", type: "shape" as const, width: "w-10", height: "h-6" },
  { value: "9:16", type: "shape" as const, width: "w-6", height: "h-10" },
  { value: "4:3", type: "shape" as const, width: "w-9", height: "h-7" },
  { value: "3:4", type: "shape" as const, width: "w-6", height: "h-9" },
  { value: "21:9", type: "shape" as const, width: "w-12", height: "h-5" },
  { value: "1:1", type: "shape" as const, width: "w-8", height: "h-8" },
];

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 font-medium text-muted-foreground text-xs peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {icon}
      {children}
    </label>
  );
}

function AspectRatioShape({
  width,
  height,
  selected,
}: {
  width: string;
  height: string;
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        "scale-90 rounded-sm",
        width,
        height,
        selected ? "bg-foreground" : "bg-foreground/20",
      )}
    />
  );
}

export function SettingsPanel({
  resolution,
  onResolutionChange,
  duration,
  onDurationChange,
  aspectRatio,
  onAspectRatioChange,
  disabled,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Resolution */}
      <div className="space-y-2">
        <SectionLabel icon={<Monitor className="h-3.5 w-3.5" />}>
          Resolution
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {RESOLUTIONS.map((option) => {
            const selected = resolution === option;
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onResolutionChange(option)}
                className={cn(
                  "rounded-lg border px-4 py-2 font-medium text-sm transition-all",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : "border-border/50 bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div
        className={cn(
          "space-y-2",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <SectionLabel icon={<Clock className="h-3.5 w-3.5" />}>
          Duration
        </SectionLabel>
        <div className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-4 py-3 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border-primary">
          <Slider
            value={[duration]}
            onValueChange={(vals) => {
              const val = vals[0];
              if (val !== undefined) onDurationChange(val);
            }}
            min={4}
            max={15}
            step={1}
            disabled={disabled}
          />
          <span className="w-8 text-right font-medium font-mono text-xs">
            {duration}s
          </span>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <SectionLabel icon={<Video className="h-3.5 w-3.5" />}>
          Aspect Ratio
        </SectionLabel>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {ASPECT_RATIOS.map((ar) => {
            const selected = aspectRatio === ar.value;
            return (
              <button
                key={ar.value}
                type="button"
                title={ar.value}
                disabled={disabled}
                onClick={() => onAspectRatioChange(ar.value)}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "aspect-square rounded-xl border-2 p-1 transition-all",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                {ar.type === "icon" ? (
                  <WandSparkles
                    className={cn(
                      "h-5 w-5",
                      selected
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                ) : (
                  <AspectRatioShape
                    width={ar.width}
                    height={ar.height}
                    selected={selected}
                  />
                )}
                <span className="mt-2 font-medium text-[10px] leading-none opacity-80">
                  {ar.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
