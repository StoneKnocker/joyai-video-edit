import {
  BookOpen,
  Image as ImageIcon,
  Scissors,
  Type,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { GUIDE_TOC, type GuideSection } from "./guide-data";

const ICONS: Record<GuideSection["icon"], typeof BookOpen> = {
  book: BookOpen,
  type: Type,
  image: ImageIcon,
  video: Video,
  scissors: Scissors,
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function GuideToc({
  className,
  hideTitle = false,
}: {
  className?: string;
  hideTitle?: boolean;
}) {
  const [activeId, setActiveId] = useState<string>("1-1");

  useEffect(() => {
    const ids = GUIDE_TOC.flatMap((s) => [
      s.id,
      ...s.children.map((c) => c.id),
    ]);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop,
          );
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={cn("w-64 shrink-0", className)}
      aria-label="Table of Contents"
    >
      <div className="sticky top-24 rounded-2xl border border-border bg-card/80 p-4 shadow-[0_0_15px_rgba(92,88,85,0.12)] backdrop-blur-md">
        {hideTitle ? null : (
          <h3 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Table of Contents
          </h3>
        )}
        <ul className="space-y-1">
          {GUIDE_TOC.map((section) => {
            const Icon = ICONS[section.icon];
            const sectionActive =
              activeId === section.id ||
              section.children.some((c) => c.id === activeId);

            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollToId(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    sectionActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-primary",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      sectionActive ? "text-primary" : "opacity-70",
                    )}
                  />
                  <span className="font-medium">
                    {section.number} {section.title}
                  </span>
                </button>
                <ul
                  className={cn(
                    "ml-3 space-y-0.5 border-l pl-3",
                    sectionActive ? "border-primary/40" : "border-border/50",
                  )}
                >
                  {section.children.map((child) => {
                    const isActive = activeId === child.id;
                    return (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => scrollToId(child.id)}
                          className={cn(
                            "w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            isActive
                              ? "font-medium text-primary"
                              : "text-muted-foreground hover:text-primary",
                          )}
                        >
                          {child.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
