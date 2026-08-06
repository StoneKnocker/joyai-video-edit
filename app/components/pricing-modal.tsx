import { useEffect, useState } from "react";
import { SeedancePricing } from "~/components/landing/seedance-pricing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface PricingModalProps {
  initialOpen?: boolean;
}

export default function PricingModal({
  initialOpen = false,
}: PricingModalProps) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    window.addEventListener("open-pricing-modal", handleOpen);
    window.addEventListener("close-pricing-modal", handleClose);

    return () => {
      window.removeEventListener("open-pricing-modal", handleOpen);
      window.removeEventListener("close-pricing-modal", handleClose);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto bg-background text-foreground shadow-[0_0_60px_rgba(0,217,146,0.14)] sm:max-w-6xl lg:max-w-7xl xl:max-w-[80vw] [&>button:hover]:text-primary [&>button]:text-muted-foreground">
        <DialogHeader>
          <DialogTitle className="font-bold text-2xl text-foreground">
            Pricing
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose the plan that works best for you. All plans include access to
            our core features.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <SeedancePricing showHeader={false} compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}
