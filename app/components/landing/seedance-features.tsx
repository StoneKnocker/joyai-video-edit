import {
  Clapperboard,
  Fingerprint,
  Layers,
  Music,
  Scissors,
  Wand2,
} from "lucide-react";
import { useAppName } from "~/lib/public-env";

const FEATURES = [
  {
    title: "Multi-Modal Input",
    description:
      "Upload up to 9 images, 3 videos (15s total), and 3 audio files. Combine text, images, videos, and audio freely to express your creative vision with unprecedented flexibility.",
    icon: Layers,
  },
  {
    title: "Reference Anything",
    description:
      "Reference motion, effects, camera movements, characters, scenes, and sounds from any uploaded content. Simply describe what you want to reference in natural language, and the model understands.",
    icon: Wand2,
  },
  {
    title: "Superior Consistency",
    description:
      "Maintain perfect consistency for faces, clothing, text, scenes, and visual styles across your entire video. No more character drift or style inconsistencies between frames.",
    icon: Fingerprint,
  },
  {
    title: "Precise Motion & Camera Replication",
    description:
      "Upload a reference video to replicate complex choreography, cinematic camera movements, and action sequences. No need for detailed prompts - just show what you want.",
    icon: Clapperboard,
  },
  {
    title: "Video Extension & Editing",
    description:
      "Smoothly extend existing videos, merge multiple clips, or edit specific segments. Replace characters, add elements, or modify actions while preserving the rest of your content.",
    icon: Scissors,
  },
  {
    title: "Built-in Audio Generation",
    description:
      "Automatically generate context-aware sound effects and background music. Sync video to uploaded audio or music beats for perfectly timed creative content.",
    icon: Music,
  },
];

export function SeedanceFeatures() {
  const appName = useAppName();

  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center lg:mb-20">
          <h2 className="mb-6 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Key Features of {appName}
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
            Powered by Seedance 2.0 — a truly controllable multi-modal AI video
            model. Reference anything, edit anything, create anything.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="group relative">
                <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-[0_0_15px_rgba(92,88,85,0.12)] transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_15px_rgba(0,217,146,0.14)]">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative mb-6">
                    <div className="inline-flex rounded-xl border border-border bg-background p-4 text-primary shadow-[0_0_15px_rgba(0,217,146,0.1)] transition-all duration-300 group-hover:border-primary/50 group-hover:text-primary">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="relative">
                    <h3 className="mb-4 text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary lg:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground lg:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
