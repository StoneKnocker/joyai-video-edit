import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm, loginPanelClassName } from "~/components/login-form";
import { useLoginModal } from "~/hooks/use-login-modal";
import { cn } from "~/lib/utils";

export function LoginModal() {
  const { t } = useTranslation();
  const { isOpen, closeLoginModal } = useLoginModal();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeLoginModal();
    }
  };

  const handleAuthenticated = async () => {
    toast.success(t("auth.toast.signedIn"));
    closeLoginModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          loginPanelClassName,
          // Border only on modal; sign-in page stays borderless.
          // Keep dialog mobile gutters (base max-w calc) and match page desktop width.
          "w-full border border-border/60 sm:max-w-[400px] [&>button:hover]:text-primary [&>button]:text-muted-foreground",
        )}
      >
        {/* Visually hidden for a11y; visible title lives inside LoginForm */}
        <DialogHeader className="sr-only">
          <DialogTitle>{t("auth.signInToYourAccount")}</DialogTitle>
          <DialogDescription>{t("auth.enterEmailToSignIn")}</DialogDescription>
        </DialogHeader>

        {isOpen && (
          <LoginForm
            idPrefix="modal"
            googleMode="popup"
            onAuthenticated={handleAuthenticated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
