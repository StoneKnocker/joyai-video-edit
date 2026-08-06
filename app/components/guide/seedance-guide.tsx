import {
  BookOpen,
  Image as ImageIcon,
  Layers,
  Scissors,
  Type,
  Video,
} from "lucide-react";
import { useAppName } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import {
  FORMULA_CARDS,
  GUIDE_HERO,
  GUIDE_SECTIONS,
  type GuideSection,
  MULTIMODAL_CARDS,
} from "./guide-data";
import { GuideExampleCard } from "./guide-example-card";
import { GuideToc } from "./guide-toc";

const SECTION_ICONS: Record<GuideSection["icon"], typeof BookOpen> = {
  book: BookOpen,
  type: Type,
  image: ImageIcon,
  video: Video,
  scissors: Scissors,
};

function FormulaGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FORMULA_CARDS.map((card) => (
        <div
          key={card.title}
          className={cn(
            "rounded-2xl border bg-card p-5 shadow-[0_0_15px_rgba(92,88,85,0.12)] transition-all duration-300",
            card.badgeTone === "required"
              ? "border-primary/40 hover:border-primary/70 hover:shadow-[0_0_15px_rgba(0,217,146,0.14)]"
              : "border-border hover:border-border/80",
          )}
        >
          <span
            className={cn(
              "mb-3 inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold text-xs",
              card.badgeTone === "required"
                ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_12px_rgba(0,217,146,0.12)]"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {card.badge}
          </span>
          <h4 className="mb-1.5 font-semibold text-base text-foreground">
            {card.title}
          </h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function MultimodalGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {MULTIMODAL_CARDS.map((card) => (
        <div
          key={card.title}
          className="group rounded-2xl border border-border bg-card p-5 shadow-[0_0_15px_rgba(92,88,85,0.12)] transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_15px_rgba(0,217,146,0.14)]"
        >
          <h4 className="mb-2 font-semibold text-foreground transition-colors group-hover:text-primary">
            {card.title}
          </h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function FormulaNote({ text }: { text: string }) {
  return (
    <div className="mb-3 rounded-xl border border-border border-l-2 border-l-primary/70 bg-card px-4 py-3 font-mono text-muted-foreground text-sm shadow-[0_0_15px_rgba(92,88,85,0.08)]">
      {text.split("\n").map((line) => (
        <p key={line.slice(0, 40)} className="leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}

export function SeedanceGuide() {
  const appName = useAppName();
  const heroTitle = GUIDE_HERO.title.replaceAll("{{appName}}", appName);
  const heroDescription = GUIDE_HERO.description.replaceAll(
    "{{appName}}",
    appName,
  );

  return (
    <div className="landing-theme relative min-h-screen bg-background text-foreground">
      {/* Ambient atmosphere */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(0,217,146,0.14),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(61,58,57,0.1)_1px,transparent_1px),linear-gradient(180deg,rgba(61,58,57,0.1)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30" />

      <div className="relative z-10">
        {/* Hero */}
        <section className="px-4 pt-6 pb-10 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 font-semibold text-primary text-sm uppercase tracking-[0.24em]">
              Prompt Playbook
            </p>
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="inline-flex rounded-xl border border-border bg-card p-2.5 text-primary shadow-[0_0_15px_rgba(0,217,146,0.12)]">
                <Layers className="h-6 w-6" />
              </span>
              <h1 className="text-balance font-display font-normal text-3xl text-foreground tracking-[-0.02em] sm:text-4xl md:text-5xl">
                {heroTitle}
              </h1>
            </div>
            <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground leading-7 sm:text-lg sm:leading-8">
              {heroDescription}
            </p>
          </div>
        </section>

        {/* Body: TOC + Content */}
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 sm:px-6 lg:flex-row lg:px-8">
          <GuideToc className="hidden lg:block" />

          <div className="min-w-0 flex-1 space-y-14">
            {/* Mobile TOC */}
            <details className="rounded-2xl border border-border bg-card p-4 shadow-[0_0_15px_rgba(92,88,85,0.12)] lg:hidden">
              <summary className="cursor-pointer font-medium text-foreground text-sm">
                Table of Contents
              </summary>
              <div className="mt-3">
                <GuideToc hideTitle className="!w-full [&_.sticky]:static" />
              </div>
            </details>

            {GUIDE_SECTIONS.map((section) => {
              const Icon = SECTION_ICONS[section.icon];
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 space-y-6"
                >
                  <h2 className="flex items-center gap-3 font-display font-normal text-2xl text-foreground tracking-[-0.02em] md:text-3xl">
                    <span className="inline-flex rounded-xl border border-border bg-card p-2 text-primary shadow-[0_0_15px_rgba(0,217,146,0.1)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      {section.number} {section.title}
                    </span>
                  </h2>

                  {section.intro ? (
                    <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed sm:text-base sm:leading-7">
                      {section.intro}
                    </p>
                  ) : null}

                  {section.subsections.map((sub) => (
                    <div
                      key={sub.id}
                      id={sub.id}
                      className="scroll-mt-24 space-y-4"
                    >
                      <h3 className="font-semibold text-foreground text-lg md:text-xl">
                        {sub.title}
                      </h3>

                      {sub.intro ? (
                        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                          {sub.intro}
                        </p>
                      ) : null}

                      {sub.formula ? <FormulaNote text={sub.formula} /> : null}

                      {sub.notes?.map((note) => (
                        <p
                          key={note.slice(0, 48)}
                          className="text-muted-foreground text-sm leading-relaxed"
                        >
                          {note}
                        </p>
                      ))}

                      {sub.special === "formula" ? <FormulaGrid /> : null}
                      {sub.special === "multimodal" ? <MultimodalGrid /> : null}

                      {sub.examples.length > 0 ? (
                        <div className="mt-2 space-y-5">
                          {sub.examples.map((example) => (
                            <GuideExampleCard
                              key={example.id}
                              example={example}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
