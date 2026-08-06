import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export type CheckoutProvider = "subotiz" | "creem" | "paypal";

const PROVIDER_LABELS: Record<CheckoutProvider, string> = {
  subotiz: "Card",
  creem: "Card / Creem",
  paypal: "PayPal",
};

const PROVIDER_DESCRIPTIONS: Record<CheckoutProvider, string> = {
  subotiz: "Pay with credit or debit card",
  creem: "Pay with credit or debit card (Creem)",
  paypal: "Pay with your PayPal account",
};

interface PaymentProviderModalProps {
  open: boolean;
  providers: CheckoutProvider[];
  onOpenChange: (open: boolean) => void;
  onSelect: (provider: CheckoutProvider) => void;
  isLoading?: boolean;
}

export function PaymentProviderModal({
  open,
  providers,
  onOpenChange,
  onSelect,
  isLoading = false,
}: PaymentProviderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose payment method</DialogTitle>
          <DialogDescription>
            Select how you want to complete this purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid gap-3">
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              disabled={isLoading}
              onClick={() => onSelect(provider)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors",
                "hover:border-primary/50 hover:bg-muted/40",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {provider === "paypal" ? (
                  <span className="font-bold text-[#003087] text-sm">PP</span>
                ) : (
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {PROVIDER_LABELS[provider]}
                </p>
                <p className="text-muted-foreground text-xs">
                  {PROVIDER_DESCRIPTIONS[provider]}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
