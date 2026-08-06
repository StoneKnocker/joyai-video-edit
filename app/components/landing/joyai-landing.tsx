import { WaitlistForm } from "~/components/landing/waitlist-form";
import { landingImages, showcaseVideoUrl } from "~/lib/landing/media";

const capabilities = [
  {
    title: "Subject & local edits",
    body: "Change people, objects, or regions with natural language while identity and motion stay coherent frame by frame.",
  },
  {
    title: "Background & style",
    body: "Swap environments or apply styles without freezing the stream or re-encoding a fixed-length clip.",
  },
  {
    title: "Motion & reference guidance",
    body: "Guide motion and look with references—edits stay causal so you never wait on future frames.",
  },
];

const useCases = [
  "Live broadcasting & real-time content creation",
  "Video communication & interactive entertainment",
  "E-commerce livestream product / model / background swaps",
  "Pre-production scene and character adjustments",
];

export function JoyaiLanding() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(0,217,146,0.14),transparent_58%)]" />

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-7xl px-4 pt-10 pb-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-4 font-semibold text-primary text-sm uppercase tracking-[0.22em]">
              Real-time open-ended video editing
            </p>
            <h1 className="text-balance font-display font-extrabold text-[34px] leading-[1.15] tracking-tight text-foreground sm:text-[44px] md:text-[52px]">
              Edit video as it streams—with natural language, not offline batch
              tools.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground leading-relaxed sm:text-lg">
              JoyAI Video Edit is a 16B autoregressive diffusion system for
              instruction-guided open-ended editing. Edit live or uploaded video
              as frames arrive—no fixed duration, no waiting for the full clip,
              no future frames required. Roughly 30 FPS end-to-end at 720×1280
              on high-throughput hardware.
            </p>
            <div className="mt-8 max-w-lg">
              <WaitlistForm id="waitlist" />
              <p className="mt-3 text-muted-foreground text-xs">
                Join the waiting list for early access updates. No payment
                required.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <img
                src={landingImages.teaser}
                alt="JoyAI Video Edit teaser overview of real-time instruction-guided editing"
                width={1280}
                height={720}
                className="h-auto w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Showcase video */}
      <section className="relative border-y border-border/60 bg-card/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Official showcase
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Streaming edits from the open JoyAI-Video-Edit release—subject,
              style, background, and more, generated causally as the stream
              progresses.
            </p>
          </div>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            {/* biome-ignore lint/a11y/useMediaCaption: research demo clip without caption track */}
            <video
              className="aspect-video h-auto w-full"
              controls
              playsInline
              preload="metadata"
              poster={landingImages.teaser}
            >
              <source src={showcaseVideoUrl} type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-3 font-bold text-2xl tracking-tight sm:text-3xl">
            Built for open-ended streaming edits
          </h2>
          <p className="mb-10 max-w-2xl text-muted-foreground">
            Preserve identity, motion, spatial structure, and unrelated regions
            while you transform the parts that matter—across the stream.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-[0_0_20px_rgba(92,88,85,0.12)]"
              >
                <h3 className="font-semibold text-lg text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case gallery before/after */}
      <section className="relative border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-3 font-bold text-2xl tracking-tight sm:text-3xl">
            Before & after from research demos
          </h2>
          <p className="mb-10 max-w-2xl text-muted-foreground">
            Case stills from the official JoyAI-Video-Edit repository
            (compressed and served from our CDN).
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {landingImages.cases.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="grid grid-cols-2 gap-px bg-border">
                  <figure className="bg-background">
                    <img
                      src={item.source}
                      alt={`${item.title} — source frame`}
                      className="aspect-video h-auto w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption className="px-2 py-1.5 text-center text-[0.7rem] text-muted-foreground uppercase tracking-wider">
                      Source
                    </figcaption>
                  </figure>
                  <figure className="bg-background">
                    <img
                      src={item.edited}
                      alt={`${item.title} — edited frame`}
                      className="aspect-video h-auto w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption className="px-2 py-1.5 text-center text-[0.7rem] text-primary uppercase tracking-wider">
                      Edited
                    </figcaption>
                  </figure>
                </div>
                <p className="px-4 py-3 font-medium text-sm">{item.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases + CTA */}
      <section className="relative border-t border-border/60 bg-card/20 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Where streaming edit shines
            </h2>
            <ul className="mt-6 space-y-3">
              {useCases.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-muted-foreground text-sm leading-relaxed"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div
            id="waitlist-cta"
            className="rounded-2xl border border-primary/40 bg-card p-8 shadow-[0_0_30px_rgba(0,217,146,0.1)]"
          >
            <h2 className="font-bold text-xl tracking-tight sm:text-2xl">
              Join the waiting list
            </h2>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Be first to hear when hosted access opens. We only use your email
              for waitlist updates—see our Privacy Policy for details.
            </p>
            <div className="mt-6">
              <WaitlistForm id="waitlist-footer" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
