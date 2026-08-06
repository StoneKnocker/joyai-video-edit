import {
  ChevronDownIcon,
  CircleGaugeIcon,
  CoinsIcon,
  ImageIcon,
  LogOutIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router";
import { toast } from "sonner";
import { Link } from "@/components/i18n-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "~/hooks/use-auth";
import { useR2Domain } from "~/lib/public-env";
import { buildR2Url } from "~/lib/r2/r2.shared";
import { trpc } from "~/lib/trpc/trpc-provider";
import { getLocalizedPath } from "~/lib/utils";

function resolveAvatarUrl(
  image: string | null | undefined,
  r2Domain: string | undefined,
): string | undefined {
  if (!image) return undefined;
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  // Relative R2 object key (any prefix the write path stores).
  if (r2Domain) {
    return buildR2Url(image, r2Domain);
  }
  return undefined;
}

export function UserNav() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, signOut, isSigningOut } = useAuth();
  const navigate = useNavigate();
  const r2Domain = useR2Domain();
  const { data: credits, isPending: isCreditsPending } =
    trpc.user.getCredits.useQuery(undefined, {
      enabled: !!user,
    });

  if (!isAuthenticated || !user) {
    return null;
  }

  const displayName =
    user.name?.trim() || user.email || t("userNav.account", "Account");
  const initials = displayName.slice(0, 2) || "U";
  const alt = displayName;
  const avatar = resolveAvatarUrl(user.image, r2Domain);
  const isAdmin = user.role === "admin";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate(getLocalizedPath(i18n.language, "/"));
    } catch {
      // useAuth already logs the mutation error
      toast.error(t("userNav.signOutFailed"));
    }
  };

  const menuItemClass =
    "cursor-pointer rounded-md text-muted-foreground focus:bg-primary focus:text-primary-foreground [&_svg]:text-primary focus:[&_svg]:text-primary-foreground";

  const creditsChipClass =
    "flex h-8 min-w-[4.5rem] items-center justify-center gap-1.5 rounded-md border bg-card px-2.5 text-primary shadow-[0_0_15px_rgba(92,88,85,0.12)] transition-colors hover:border-primary/40 hover:bg-black/10";

  return (
    <div className="flex items-center gap-2">
      {isCreditsPending ? (
        <div
          className="h-8 min-w-[4.5rem] animate-pulse rounded-md border bg-card"
          aria-hidden
        />
      ) : credits != null ? (
        <Link
          to="/user/credits"
          aria-label={t("userNav.viewCredits")}
          className={creditsChipClass}
        >
          <CoinsIcon className="h-4 w-4" />
          <span className="font-mono text-sm">{credits.total}</span>
        </Link>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            aria-label={t("userNav.accountMenu")}
            className="h-9 cursor-pointer gap-1 rounded-md border border-transparent px-1.5 text-muted-foreground hover:bg-card hover:text-primary focus-visible:ring-primary/40 data-[state=open]:border-primary/60 data-[state=open]:bg-card data-[state=open]:text-primary"
          >
            <Avatar className="size-8 border">
              {avatar ? <AvatarImage src={avatar} alt={alt} /> : null}
              <AvatarFallback className="bg-card font-bold text-primary text-xs uppercase">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDownIcon className="h-3 w-3 text-current" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 bg-card p-2 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_20px_rgba(0,217,146,0.08)]"
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-3 text-left text-sm">
              <Avatar className="h-9 w-9 rounded-md border">
                {avatar ? <AvatarImage src={avatar} alt={alt} /> : null}
                <AvatarFallback className="rounded-md bg-card text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">
                  {displayName}
                </span>
                {user.email && user.name?.trim() ? (
                  <span className="truncate text-muted-foreground text-xs">
                    {user.email}
                  </span>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-2 bg-secondary" />
          <DropdownMenuItem asChild className={menuItemClass}>
            <Link to="/user/creations">
              <ImageIcon />
              {t("userNav.myCreations")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={menuItemClass}>
            <Link to="/user/credits">
              <CoinsIcon />
              {t("userNav.myCredits")}
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild className={menuItemClass}>
              <RouterLink to="/admin/creations">
                <CircleGaugeIcon />
                {t("userNav.adminPanel")}
              </RouterLink>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="my-2 bg-secondary" />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="cursor-pointer rounded-md text-muted-foreground focus:bg-red-950/40 focus:text-red-300 data-[disabled]:cursor-not-allowed [&_svg]:text-muted-foreground focus:[&_svg]:text-red-300"
          >
            <LogOutIcon />
            {isSigningOut ? t("userNav.signingOut") : t("userNav.logOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
