import {
  Building2,
  Clapperboard,
  Film,
  GraduationCap,
  Megaphone,
  Music,
  Scissors,
  Share2,
  Sparkles,
} from "lucide-react";
import { useAppName } from "~/lib/public-env";

const USE_CASES = [
  {
    title: "Advertising & Marketing",
    description:
      "Create compelling promotional content by referencing successful ad templates. Replicate proven creative formats with your own products and branding.",
    tags: [
      "Product Videos",
      "Brand Content",
      "Commercial Ads",
      "Template Replication",
    ],
    icon: Megaphone,
  },
  {
    title: "Education & Training",
    description:
      "Bring lessons to life with engaging visual content. Create animated explanations, historical reconstructions, and interactive tutorials.",
    tags: ["Course Content", "Tutorials", "Demos", "Visual Lessons"],
    icon: GraduationCap,
  },
  {
    title: "Creative Storytelling",
    description:
      "Craft unique narratives using multi-modal inputs. Reference film techniques, replicate cinematic styles, and extend your stories seamlessly.",
    tags: ["Short Films", "Art Projects", "Music Videos", "Visual Poetry"],
    icon: Sparkles,
  },
  {
    title: "Social Media Content",
    description:
      "Generate scroll-stopping content by referencing trending templates and effects. Replicate viral formats with your own creative twist.",
    tags: [
      "Instagram Reels",
      "TikTok Videos",
      "YouTube Shorts",
      "Trending Effects",
    ],
    icon: Share2,
  },
  {
    title: "Motion & Dance Videos",
    description:
      "Upload reference choreography or motion clips and apply them to any character. Perfect for dance covers, motion replication, and action sequences.",
    tags: [
      "Dance Covers",
      "Action Sequences",
      "Motion Capture",
      "Choreography",
    ],
    icon: Clapperboard,
  },
  {
    title: "Video Editing & Extension",
    description:
      "Extend existing videos seamlessly, merge multiple clips, or edit specific segments without regenerating everything from scratch.",
    tags: [
      "Video Extension",
      "Scene Merging",
      "Content Editing",
      "Clip Connection",
    ],
    icon: Scissors,
  },
  {
    title: "Film Pre-Visualization",
    description:
      "Reference film clips to replicate camera movements, transitions, and visual effects. Test cinematography before production.",
    tags: [
      "Storyboarding",
      "Camera Planning",
      "Effect Testing",
      "Concept Proofing",
    ],
    icon: Film,
  },
  {
    title: "Real Estate & Architecture",
    description:
      "Transform static property images into immersive walkthroughs. Reference architectural styles and create compelling virtual tours.",
    tags: [
      "Virtual Tours",
      "Property Showcases",
      "Interior Design",
      "Architectural Visuals",
    ],
    icon: Building2,
  },
  {
    title: "Music & Audio Sync",
    description:
      "Generate videos that perfectly sync to your audio tracks. Create music visuals, lyric videos, and beat-matched content effortlessly.",
    tags: ["Music Videos", "Lyric Visuals", "Beat Sync", "Audio Reactive"],
    icon: Music,
  },
];

export function SeedanceUseCases() {
  const appName = useAppName();

  return (
    <section className="relative overflow-hidden bg-background py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Use Cases
            </span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Endless Possibilities For Every Creator
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            From viral content to professional productions, {appName} empowers
            creators across industries to bring their multi-modal visions to
            life.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {USE_CASES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-[0_0_15px_rgba(92,88,85,0.12)] transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_15px_rgba(0,217,146,0.14)] sm:p-8"
              >
                <div className="absolute inset-0 rounded-2xl border-2 border-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-3 flex items-center gap-3">
                  <div className="relative">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary transition-colors duration-300 group-hover:border-primary/50">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary sm:text-2xl">
                    {item.title}
                  </h3>
                </div>

                <p className="mb-6 leading-relaxed text-muted-foreground">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground sm:text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
