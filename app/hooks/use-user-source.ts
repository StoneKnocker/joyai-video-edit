import { useEffect } from "react";
import { initUserSourceTracking } from "@/lib/user-source.client";

/**
 * Hook to initialize user source tracking.
 * Call this once in your root component.
 */
export function useUserSourceTracking(): void {
  useEffect(() => {
    initUserSourceTracking();
  }, []);
}
