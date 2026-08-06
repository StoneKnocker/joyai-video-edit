import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface VideoLightboxProps {
  src: string;
  poster?: string;
  onClose: () => void;
}

export function VideoLightbox({ src, poster, onClose }: VideoLightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          className="aspect-video h-auto w-full bg-black"
          src={src}
          poster={poster}
          controls
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    </div>,
    document.body,
  );
}
