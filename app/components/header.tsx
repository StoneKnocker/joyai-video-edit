import { Menu, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Link } from "@/components/i18n-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";

const mobileNavLinkClass = cn(
  "rounded-md px-4 py-3 text-left font-medium text-muted-foreground transition-colors",
  "hover:bg-card hover:text-primary",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
);

const Header: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on route change only
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 bg-background/60 backdrop-blur-md transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? "shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between text-foreground">
          <AppLogo />

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              size="sm"
              asChild
              className="hidden rounded-md border border-primary/60 bg-card font-semibold text-primary shadow-[0_0_20px_rgba(0,217,146,0.12)] hover:bg-black/20 hover:text-primary md:inline-flex"
            >
              <Link to="/#waitlist">Join Waiting List</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label={
                isMobileMenuOpen
                  ? t("header.closeMobileMenu", "Close navigation menu")
                  : t("header.openMobileMenu", "Open navigation menu")
              }
              className="rounded-md p-2 text-muted-foreground hover:bg-card hover:text-primary focus:outline-none md:hidden"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="slide-in-from-top-5 absolute top-16 right-0 left-0 flex animate-in flex-col gap-4 border-b bg-background p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] duration-200 md:hidden">
          <Link
            to="/#waitlist"
            className={mobileNavLinkClass}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Join Waiting List
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
