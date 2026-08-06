import { Button } from "~/components/ui/button";
import { useWorkspace } from "~/contexts/workspace-context";
import { useAppName } from "~/lib/public-env";

export function SeedanceCTA() {
  const { showWorkspaceWithTemplate } = useWorkspace();
  const appName = useAppName();

  return (
    <section className="relative overflow-hidden border-y border-border bg-background py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0-10c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0-10c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zM24 34c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0-10c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0-10c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zM12 34c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0-10c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-foreground md:text-5xl">
            Ready to Experience Multi-Modal AI Video Creation?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            Join thousands of creators who are already transforming their ideas
            into stunning videos with {appName}.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,217,146,0.28)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_36px_rgba(0,217,146,0.4)]"
              onClick={() => showWorkspaceWithTemplate()}
            >
              Start Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
