import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth.client";
import { AppLogo } from "~/components/app-logo";
import { Link } from "~/components/i18n-link";
import { refreshAuthSession } from "~/lib/auth/auth-session";
import { openOAuthPopup } from "~/lib/auth/oauth-popup";
import { cn } from "~/lib/utils";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Shared shell styles for login modal DialogContent and sign-in page card.
 * Border is host-specific: modal adds it, sign-in page does not.
 * Width constraints stay on the host (page vs dialog) so mobile gutters don't fight.
 */
export const loginPanelClassName =
  "gap-0 rounded-xl bg-card p-6 text-foreground shadow-[0_0_50px_rgba(0,217,146,0.12)] sm:p-8";

export type LoginFormProps = {
  /** Unique prefix for form control ids when multiple instances may exist. */
  idPrefix?: string;
  /**
   * popup — OAuth in a popup (modal). redirect — full-page OAuth (sign-in page).
   */
  googleMode: "popup" | "redirect";
  /** Post-login path for redirect Google OAuth / page OTP success. */
  redirectTo?: string;
  /**
   * Called after session is established in-page (popup Google or email OTP).
   * Not used for redirect Google (browser navigates away).
   */
  onAuthenticated?: () => void | Promise<void>;
  className?: string;
};

export function LoginForm({
  idPrefix = "login",
  googleMode,
  redirectTo,
  onAuthenticated,
  className,
}: LoginFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState("");

  const busy = isLoading || isGoogleLoading;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setIsOtpSent(true);
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setError(getErrorMessage(err, t("auth.errors.sendOtpFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !email) return;

    setIsLoading(true);
    setError("");

    try {
      await authClient.signIn.emailOtp({
        email,
        otp,
      });
      await refreshAuthSession(queryClient);
      await onAuthenticated?.();
    } catch (err) {
      console.error("OTP login failed:", err);
      setError(getErrorMessage(err, t("auth.errors.invalidOtp")));
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");

    if (googleMode === "redirect") {
      try {
        await authClient.signIn.social({
          provider: "google",
          callbackURL: redirectTo ?? "/",
        });
      } catch (err) {
        console.error("Google login failed:", err);
        setIsGoogleLoading(false);
        setError(getErrorMessage(err, t("auth.errors.googleLoginFailed")));
      }
      return;
    }

    try {
      const result = await openOAuthPopup({ provider: "google" });

      switch (result.status) {
        case "success": {
          await refreshAuthSession(queryClient);
          await onAuthenticated?.();
          break;
        }
        case "blocked": {
          setError(t("auth.errors.popupBlocked"));
          setIsGoogleLoading(false);
          break;
        }
        case "cancelled": {
          setIsGoogleLoading(false);
          break;
        }
        case "error": {
          setError(result.message || t("auth.errors.googleLoginFailed"));
          setIsGoogleLoading(false);
          break;
        }
      }
    } catch (err) {
      console.error("Google login failed:", err);
      setIsGoogleLoading(false);
      setError(getErrorMessage(err, t("auth.errors.googleLoginFailed")));
    }
  };

  const handleBack = () => {
    setIsOtpSent(false);
    setOtp("");
    setError("");
  };

  const emailId = `${idPrefix}-email`;
  const otpId = `${idPrefix}-otp`;

  return (
    <div className={cn("grid gap-6", className)}>
      <div className="flex flex-col items-center gap-4 text-center">
        <AppLogo />
        <div className="flex flex-col gap-1.5">
          {isOtpSent && (
            <h2 className="font-semibold text-foreground text-xl tracking-tight">
              {t("auth.verifyYourEmail")}
            </h2>
          )}
          <p className="text-muted-foreground text-sm">
            {isGoogleLoading && googleMode === "popup" ? (
              t("auth.completeSignInInPopup")
            ) : isOtpSent ? (
              <>
                {t("auth.verificationCodeSentTo")}
                <span className="mt-1 block font-medium text-foreground">
                  {email}
                </span>
              </>
            ) : (
              t("auth.enterEmailToSignIn")
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {!isOtpSent ? (
          <>
            {/* Primary: Google */}
            <Button
              type="button"
              size="lg"
              disabled={busy}
              onClick={handleGoogleLogin}
              // Use theme tokens (not bg-white): .landing-theme remaps [class*="bg-white"] to dark.
              className="h-11 w-full border border-border bg-foreground font-medium text-background shadow-[0_0_28px_rgba(255,255,255,0.08)] hover:bg-foreground/90 hover:text-background"
            >
              {!isGoogleLoading && <GoogleIcon className="size-5" />}
              {isGoogleLoading
                ? t("auth.waitingForGoogle")
                : t("auth.continueWithGoogle")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-border border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("auth.orContinueWithEmail")}
                </span>
              </div>
            </div>

            {/* Secondary: Email OTP */}
            <form onSubmit={handleSendOtp}>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor={emailId} className="sr-only">
                    {t("auth.email")}
                  </Label>
                  <Input
                    id={emailId}
                    placeholder={t("auth.email")}
                    type="email"
                    className="bg-background text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/70 focus-visible:ring-primary/30"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={busy}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  disabled={busy}
                  type="submit"
                  variant="outline"
                  className="w-full border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-background hover:text-foreground"
                >
                  {isLoading ? (
                    <>
                      <Mail className="size-4 animate-pulse" />
                      {t("auth.sendingCode")}
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" />
                      {t("auth.sendVerificationCode")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor={otpId} className="sr-only">
                  {t("auth.verificationCode")}
                </Label>
                <Input
                  id={otpId}
                  placeholder={t("auth.enterSixDigitCode")}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoCapitalize="none"
                  autoComplete="one-time-code"
                  disabled={busy}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  className="bg-background text-center font-mono text-foreground text-lg tracking-widest placeholder:text-muted-foreground focus-visible:border-primary/70 focus-visible:ring-primary/30"
                />
              </div>
              <Button
                disabled={busy || otp.length !== 6}
                type="submit"
                size="lg"
                className="h-11 w-full border border-primary/70 bg-primary text-primary-foreground shadow-[0_0_24px_rgba(0,217,146,0.16)] hover:bg-primary/90 hover:text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <CheckCircle2 className="size-4 animate-pulse" />
                    {t("auth.verifying")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    {t("auth.verifyAndSignIn")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:bg-background hover:text-primary"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="size-4" />
                {t("auth.backToEmail")}
              </Button>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-muted-foreground text-xs leading-relaxed">
        <Trans
          i18nKey="auth.agreement"
          components={{
            terms: (
              <Link
                to="/terms-and-conditions"
                className="underline underline-offset-4 hover:text-primary"
              />
            ),
            privacy: (
              <Link
                to="/privacy-policy"
                className="underline underline-offset-4 hover:text-primary"
              />
            ),
          }}
        />
      </p>
    </div>
  );
}
