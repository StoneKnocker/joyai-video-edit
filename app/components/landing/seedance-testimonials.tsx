import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useAppName } from "~/lib/public-env";

function withAppName(text: string, appName: string) {
  return text.replaceAll("{{appName}}", appName);
}

const TESTIMONIALS = [
  {
    quote:
      "With {{appName}}, I can copy a dance move and put it on any character. The motion looks real. This tool changed how I make videos!",
    name: "Sarah Chen",
    role: "Content Creator",
    avatar: "https://cdn.vidrushai.com/seedance2-assets/avatars/sarah-chen.jpg",
  },
  {
    quote:
      "I uploaded a movie clip to {{appName}}, and it copied the camera moves perfectly. This is what AI video should feel like.",
    name: "Marcus Rodriguez",
    role: "Filmmaker",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/marcus-rodriguez.jpg",
  },
  {
    quote:
      "Faces, clothes, even small text stay the same in every shot. {{appName}} fixed our biggest problem—characters that keep changing!",
    name: "Emily Watson",
    role: "Art Director",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/emily-watson.jpg",
  },
  {
    quote:
      "{{appName}} can make my clips longer or join scenes together. It feels like a smart video editor that just gets what I want.",
    name: "David Kim",
    role: "Video Editor",
    avatar: "https://cdn.vidrushai.com/seedance2-assets/avatars/david-kim.jpg",
  },
  {
    quote:
      "I take trending video styles and remake them in my own way with {{appName}}. I post way more content now—and it still looks great.",
    name: "Priya Sharma",
    role: "Social Media Manager",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/priya-sharma.jpg",
  },
  {
    quote:
      "{{appName}} adds music that matches the video. No more hunting for stock tracks. Sound and picture just work together.",
    name: "Alex Turner",
    role: "Music Producer",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/alex-turner.jpg",
  },
  {
    quote:
      "I use {{appName}} to turn hard topics into clear, fun videos. My students love the lessons—and so do I.",
    name: "Jessica Liu",
    role: "Online Educator",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/jessica-liu.jpg",
  },
  {
    quote:
      "With {{appName}}, every video in our brand campaign looks like it came from the same team. Clean, clear, and on-brand every time.",
    name: "Mohammed Hassan",
    role: "Brand Strategist",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/mohammed-hassan.jpg",
  },
  {
    quote:
      "House tours used to take days. With {{appName}}, a few photos become a nice video tour in minutes. My clients are amazed!",
    name: "Olivia Martinez",
    role: "Real Estate Agent",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/olivia-martinez.jpg",
  },
  {
    quote:
      "I use {{appName}} on every project to show ideas before we shoot. It saves money and helps the whole team understand the plan.",
    name: "Thomas Anderson",
    role: "Creative Director",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/thomas-anderson.jpg",
  },
  {
    quote:
      "{{appName}} lets me mix reference videos, photos, and music in one place. It's the easiest AI video tool I've ever used.",
    name: "Dr. Linda Park",
    role: "Research Scientist",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/dr-linda-park.jpg",
  },
  {
    quote:
      "Our team makes training videos much faster with {{appName}}. We edit what we have instead of filming everything again.",
    name: "Robert Chen",
    role: "Corporate Trainer",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/robert-chen.jpg",
  },
  {
    quote:
      "I uploaded a dance clip, and {{appName}} put the same moves on my character on the first try. The motion is almost scary good!",
    name: "Aria Johnson",
    role: "Dance Choreographer",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/aria-johnson.jpg",
  },
  {
    quote:
      "From first idea to finished video, {{appName}} is part of how I work every day. The quality just keeps getting better.",
    name: "Jake Morrison",
    role: "YouTuber",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/jake-morrison.jpg",
  },
  {
    quote:
      "I make food videos. With {{appName}}, my shots look pro—like I have a film crew—even when it's just me in the kitchen.",
    name: "Chef Maria Santos",
    role: "Culinary Creator",
    avatar:
      "https://cdn.vidrushai.com/seedance2-assets/avatars/chef-maria-santos.jpg",
  },
];

type ResolvedTestimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

function TestimonialCard({
  testimonial,
}: {
  testimonial: ResolvedTestimonial;
}) {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-10 shadow-[0_0_15px_rgba(92,88,85,0.12)]">
      <p className="leading-relaxed text-muted-foreground">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <div className="font-medium leading-5 tracking-tight text-foreground">
            {testimonial.name}
          </div>
          <div className="leading-5 tracking-tight text-muted-foreground">
            {testimonial.role}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeColumn({
  items,
  direction,
  speed,
}: {
  items: ResolvedTestimonial[];
  direction: "up" | "down";
  speed: "fast" | "slow" | "normal";
}) {
  // direction 决定方向；speed 仅影响向上滚动时的时长（CSS 仅有 up 的速度变体）
  const animationClass =
    direction === "down"
      ? "animate-sd-scroll-down"
      : speed === "slow"
        ? "animate-sd-scroll-up-slow"
        : "animate-sd-scroll-up";

  return (
    <div className="flex flex-col gap-6 pb-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
      <div className={`flex flex-col gap-6 ${animationClass}`}>
        {items.map((t, i) => (
          <TestimonialCard key={`a-${i}`} testimonial={t} />
        ))}
        {items.map((t, i) => (
          <TestimonialCard key={`b-${i}`} testimonial={t} />
        ))}
      </div>
    </div>
  );
}

export function SeedanceTestimonials() {
  const appName = useAppName();
  const testimonials = useMemo(
    () =>
      TESTIMONIALS.map((item) => ({
        ...item,
        quote: withAppName(item.quote, appName),
      })),
    [appName],
  );
  const col1 = testimonials.slice(0, 5);
  const col2 = testimonials.slice(5, 10);
  const col3 = testimonials.slice(10, 15);

  return (
    <section className="relative bg-background py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto">
        <div className="mx-auto flex flex-col items-center justify-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Testimonials
            </span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Loved by Creators Worldwide
          </h2>
          <p className="mt-6 max-w-3xl text-center text-lg leading-relaxed text-muted-foreground">
            See what our customers have to say about {appName} and how it&apos;s
            transforming their creative workflows.
          </p>
        </div>

        <div className="mx-auto mt-16 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
          <div className="hidden lg:block">
            <MarqueeColumn items={col1} direction="up" speed="normal" />
          </div>
          <div className="hidden sm:block">
            <MarqueeColumn items={col2} direction="down" speed="slow" />
          </div>
          <div>
            <MarqueeColumn items={col3} direction="up" speed="fast" />
          </div>
        </div>
      </div>
    </section>
  );
}
