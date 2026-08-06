import {
  ArrowUpRight,
  ChevronDown,
  Facebook,
  Globe,
  Instagram,
  Mail,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router";
import { i18nConfig, languageDisplayNames } from "@/lib/config";
import { useAppName, usePublicEnv, useSupportEmail } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";
import { Link } from "./i18n-link";
import { XSocialIcon } from "./icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const footerLinkClass = cn(
  "group inline-flex w-fit items-center gap-1.5 rounded-md px-0 py-0 text-muted-foreground text-sm transition-colors",
  "hover:text-primary",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

const socialLinkClass = cn(
  "inline-flex size-10 items-center justify-center rounded-md border bg-card text-muted-foreground shadow-[0_0_15px_rgba(92,88,85,0.16)] transition-all",
  "hover:-translate-y-0.5 hover:border-primary/70 hover:text-primary",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

const languageSwitcherClass = cn(
  "flex items-center gap-1.5 rounded-md border bg-card px-3.5 py-2 text-muted-foreground shadow-[0_0_15px_rgba(92,88,85,0.12)] backdrop-blur-sm transition-all",
  "hover:border-primary/70 hover:text-foreground",
  "focus-visible:border-primary/70 focus-visible:outline-none",
);

const showLanguageSwitcher = i18nConfig.supportLanguages.length > 0;

type FooterLinkItem =
  | { label: string; to: string }
  | { label: string; href: string };

type FooterNavGroup = {
  title: string;
  links: FooterLinkItem[];
};

type BacklinkBadge = {
  title: string;
  href: string;
  img: string;
  enabled: boolean;
};

const backlinkBadges: BacklinkBadge[] = [
  {
    title: "AI Face Cutout",
    href: "https://aifacecutout.com/",
    img: "",
    enabled: true,
  },
  {
    title: "ToolPilot",
    href: "https://www.toolpilot.ai/",
    img: "https://www.toolpilot.ai/cdn/shop/files/f-w_690x151_crop_center.png?v=1695883028",
    enabled: true,
  },
  {
    title: "AI Agents Directory",
    href: "https://aiagentsdirectory.com/agent/bonsai-image",
    img: "https://aiagentsdirectory.com/featured-badge.svg?v=2024",
    enabled: true,
  },
  {
    title: "Findly Tools",
    href: "https://findly.tools/illustrious-xl?utm_source=illustrious-xl",
    img: "https://findly.tools/badges/findly-tools-badge-light.svg",
    enabled: true,
  },
  {
    title: "DeepLaunch",
    href: "https://deeplaunch.io/",
    img: "https://deeplaunch.io/badge/badge_light.svg",
    enabled: true,
  },
  {
    title: "Dang AI",
    href: "https://dang.ai/",
    img: "https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png",
    enabled: true,
  },
  {
    title: "Fazier",
    href: "https://fazier.com/",
    img: "https://fazier.com/api/v1/public/badges/launch_badges.svg?badge_type=launched&theme=dark",
    enabled: true,
  },
  {
    title: "AIDirs",
    href: "https://aidirs.best/item/bonsai-image",
    img: "https://aidirs.best/light.svg",
    enabled: true,
  },
  {
    title: "AI Directories",
    href: "https://www.aidirectori.es",
    img: "https://cdn.aidirectori.es/ai-tools/badges/dark-mode.png",
    enabled: true,
  },
  {
    title: "OnToplist",
    href: "https://www.ontoplist.com/best-technology-blogs/",
    img: "https://www.ontoplist.com/images/ontoplist31.png?id=6a26a151ba71f",
    enabled: true,
  },
  {
    title: "Findly Tools (CyberRealistic XL)",
    href: "https://findly.tools/cyberrealistic-xl?utm_source=cyberrealistic-xl",
    img: "https://findly.tools/badges/findly-tools-badge-light.svg",
    enabled: true,
  },
  {
    title: "AIExtension.ai",
    href: "https://aiextension.ai/cyberrealistic-xl",
    img: "https://aiextension.ai/badges/aiextension-light.svg",
    enabled: true,
  },
  {
    title: "EarlyHunt",
    href: "https://earlyhunt.com/project/cyberrealistic-xl",
    img: "https://earlyhunt.com/badges/earlyhunt-badge-light.svg",
    enabled: true,
  },
];

export default function Footer() {
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const appName = useAppName();
  const supportEmail = useSupportEmail();
  const appUrl = usePublicEnv()?.APP_URL ?? "";
  const socialHref = `${appUrl}/#`;
  const languageLinks = i18nConfig.supportLanguages;
  const currentLocale = params.locale || i18nConfig.defaultLanguage;
  const showBacklinkRail = false;
  const normalizedPathname =
    currentLocale !== i18nConfig.defaultLanguage &&
    (location.pathname === `/${currentLocale}` ||
      location.pathname.startsWith(`/${currentLocale}/`))
      ? location.pathname.slice(currentLocale.length + 1) || "/"
      : location.pathname;
  const localizedTarget = `${normalizedPathname}${location.search}${location.hash}`;
  const navGroups: FooterNavGroup[] = [
    {
      title: t("footer.resources"),
      links: [
        { label: "Join Waiting List", to: "/#waitlist" },
        { label: t("footer.contact"), href: `mailto:${supportEmail}` },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("privacyLabel"), to: "/privacy-policy" },
        { label: t("cookieLabel"), to: "/cookie-policy" },
        { label: t("terms"), to: "/terms-and-conditions" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(61,58,57,0.16)_1px,transparent_1px),linear-gradient(180deg,rgba(61,58,57,0.12)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:justify-between">
          <div className="relative max-w-sm text-foreground">
            <div>
              <AppLogo />
              <p className="mt-5 max-w-xs text-pretty text-muted-foreground text-sm leading-6">
                {appName} — real-time, instruction-guided open-ended video
                editing. Join the waiting list for early access updates.
              </p>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col lg:max-w-3xl">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:gap-14">
              {navGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-5">
                  <p className="font-semibold text-muted-foreground text-[0.8rem] uppercase tracking-[0.22em]">
                    {group.title}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {group.links.map((item) => (
                      <li key={item.label}>
                        {"to" in item ? (
                          <Link to={item.to} className={footerLinkClass}>
                            <span>{item.label}</span>
                            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                        ) : (
                          <a href={item.href} className={footerLinkClass}>
                            <span>{item.label}</span>
                            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 pt-6 text-muted-foreground text-sm sm:flex-row sm:items-start sm:justify-between sm:pt-10">
          <div className="">
            <div className="mb-3 flex items-center gap-3">
              <a
                href={`mailto:${supportEmail}`}
                aria-label={t("footer.contact")}
                className={socialLinkClass}
              >
                <Mail className="size-4" />
              </a>
              <a href={socialHref} aria-label="X" className={socialLinkClass}>
                <XSocialIcon className="size-4" />
              </a>
              <a
                href={socialHref}
                aria-label="Instagram"
                className={socialLinkClass}
              >
                <Instagram className="size-4" />
              </a>
              <a
                href={socialHref}
                aria-label="Facebook"
                className={socialLinkClass}
              >
                <Facebook className="size-4" />
              </a>
            </div>
            {showBacklinkRail ? (
              <div
                className="flex flex-col gap-3 overflow-y-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  maxHeight: "9rem",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, black 14px, black calc(100% - 14px), transparent 100%)",
                }}
              >
                {backlinkBadges
                  .filter((badge) => badge.enabled)
                  .map((badge) => (
                    <a
                      key={badge.title}
                      href={badge.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={badge.title}
                      className="group hover:-translate-y-0.5 flex items-center justify-start transition-transform"
                    >
                      {badge.img ? (
                        <img
                          src={badge.img}
                          alt={badge.title}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="max-h-10 w-auto max-w-full object-contain opacity-65 grayscale invert transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-hover:invert-0"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm transition duration-300 group-hover:text-primary">
                          {badge.title}
                        </span>
                      )}
                    </a>
                  ))}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
            {showLanguageSwitcher ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={t("footer.language")}
                    className={cn(
                      languageSwitcherClass,
                      "min-w-24 justify-between",
                    )}
                  >
                    <Globe className="size-4 text-muted-foreground" />
                    <span className="text-sm">
                      {languageDisplayNames[currentLocale] ?? currentLocale}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-lg bg-card/95 p-1 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-sm"
                  >
                    {languageLinks.map((language) => (
                      <DropdownMenuItem key={language} asChild>
                        <Link
                          to={localizedTarget}
                          locale={language}
                          className="block rounded-md px-3 py-2 text-muted-foreground text-sm no-underline transition-colors hover:text-primary focus:bg-background focus:text-primary"
                        >
                          {languageDisplayNames[language] ?? language}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Crawler-visible fallback links: DropdownMenuContent unmounts when closed */}
                <nav className="sr-only">
                  {languageLinks.map((language) => (
                    <Link key={language} to={localizedTarget} locale={language}>
                      {languageDisplayNames[language] ?? language}
                    </Link>
                  ))}
                </nav>
              </>
            ) : null}
            <p className="text-muted-foreground text-sm">
              Research-inspired waitlist for JoyAI Video Edit
            </p>
            <div className="flex flex-col gap-1 text-left lg:text-right">
              <p className="text-balance text-muted-foreground">
                © {currentYear} {appName}. {t("footer.allRightsReserved")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
