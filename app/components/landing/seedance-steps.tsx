import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useWorkspace } from "~/contexts/workspace-context";
import { useAppName } from "~/lib/public-env";

const STEPS = [
  {
    number: "1",
    title: "Upload Your Assets",
    description:
      "Upload images, videos, or audio files as references. You can combine up to 12 files across different modalities to express your vision.",
  },
  {
    number: "2",
    title: "Describe Your Vision",
    description:
      "Use natural language to describe what you want. Reference specific assets by tagging them, like 'Use @image1 as the first frame and follow the motion in @video1.'",
  },
  {
    number: "3",
    title: "Generate & Iterate",
    description:
      "Generate your video in 4-15 seconds length. Extend, edit, or refine your creation by uploading the result and making targeted adjustments.",
  },
];

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className="flex flex-1 flex-col items-center max-w-sm text-center">
      <div className="mb-8 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-card">
          <span className="text-3xl font-bold text-primary">{step.number}</span>
        </div>
      </div>
      <h3 className="mb-4 text-2xl font-bold text-foreground">{step.title}</h3>
      <p className="leading-relaxed text-muted-foreground">
        {step.description}
      </p>
    </div>
  );
}

export function SeedanceSteps() {
  const { showWorkspaceWithTemplate } = useWorkspace();
  const appName = useAppName();

  return (
    <section className="relative overflow-hidden bg-background py-20">
      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            How to Create AI Videos with {appName}
          </h2>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 lg:flex-row lg:gap-4">
          {STEPS.map((step, index) => (
            <div key={step.number} className="contents">
              <StepCard step={step} />
              {index < STEPS.length - 1 && (
                <div className="hidden flex-shrink-0 lg:block">
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,217,146,0.28)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_36px_rgba(0,217,146,0.4)]"
            onClick={() => showWorkspaceWithTemplate()}
          >
            Start Creating Now
          </Button>
        </div>
      </div>
    </section>
  );
}
