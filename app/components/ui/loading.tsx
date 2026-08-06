import type * as React from "react";
import { cn } from "~/lib/utils";
import { Spinner } from "~/components/spinner";
import { Button } from "~/components/ui/button";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  textClassName?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  overlayClassName?: string;
}

export function Loading({
  size = "md",
  text,
  className,
  textClassName,
  fullScreen = false,
  overlay = true,
  overlayClassName,
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const LoadingContent = (
    <div
      className={cn(
        "flex items-center gap-2",
        !text && "justify-center",
        fullScreen && "flex-col gap-4",
        className,
      )}
    >
      <Spinner
        className={cn(
          "text-primary drop-shadow-[0_0_12px_rgba(0,217,146,0.4)]",
          sizeClasses[size],
          fullScreen && "h-11 w-11",
        )}
      />
      {text && (
        <span
          className={cn(
            "font-medium",
            fullScreen
              ? "text-sm tracking-wide text-muted-foreground"
              : cn("text-primary", textSizeClasses[size]),
            textClassName,
          )}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          overlay ? "bg-background" : "bg-transparent",
          overlayClassName,
        )}
        role="status"
        aria-live="polite"
        aria-label={text || "Loading"}
      >
        {/* Soft ambient glow — no card / border chrome for popup windows */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative">{LoadingContent}</div>
      </div>
    );
  }

  return LoadingContent;
}

type LoadingButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "asChild"
> & {
  loading?: boolean;
  loadingText?: string;
};

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  size = "lg",
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      size={size}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Spinner
            className={cn("text-current", size === "sm" ? "size-3" : "size-4")}
          />
          <span>{loadingText || "Loading..."}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
