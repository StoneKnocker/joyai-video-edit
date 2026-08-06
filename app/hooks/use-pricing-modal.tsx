import { useCallback } from "react";

export function usePricingModal() {
  const openPricingModal = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-pricing-modal"));
  }, []);

  const closePricingModal = useCallback(() => {
    window.dispatchEvent(new CustomEvent("close-pricing-modal"));
  }, []);

  return { openPricingModal, closePricingModal };
}
