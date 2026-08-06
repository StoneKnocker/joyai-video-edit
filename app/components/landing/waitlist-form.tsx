import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { trpc } from "~/lib/trpc/trpc-provider";
import { cn } from "~/lib/utils";

type WaitlistFormProps = {
  id?: string;
  className?: string;
  compact?: boolean;
};

export function WaitlistForm({
  id = "waitlist",
  className,
  compact = false,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const join = trpc.waitlist.join.useMutation({
    onSuccess: (data) => {
      if (data.status === "already_joined") {
        toast.success("You're already on the waiting list.");
      } else {
        toast.success("You're on the waiting list. We'll be in touch.");
      }
      setEmail("");
    },
    onError: (err) => {
      toast.error(err.message || "Could not join the waiting list. Try again.");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    join.mutate({ email });
  }

  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className={cn(
        "flex w-full flex-col gap-3",
        compact
          ? "sm:flex-row sm:items-center"
          : "sm:flex-row sm:items-stretch",
        className,
      )}
    >
      <label className="sr-only" htmlFor={`${id}-email`}>
        Email address
      </label>
      <Input
        id={`${id}-email`}
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={join.isPending}
        className="h-11 min-w-0 flex-1 rounded-md border-border bg-card text-foreground"
      />
      <Button
        type="submit"
        disabled={join.isPending}
        className="h-11 shrink-0 rounded-md border border-primary/60 bg-card px-6 font-semibold text-primary shadow-[0_0_20px_rgba(0,217,146,0.12)] hover:bg-black/20 hover:text-primary"
      >
        {join.isPending ? "Joining…" : "Join Waiting List"}
      </Button>
    </form>
  );
}
