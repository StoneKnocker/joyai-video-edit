import { MessageCircleMore, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/hooks/use-auth";
import { getPublicEnv } from "~/lib/env.server";
import { trpc } from "~/lib/trpc/trpc-provider";
import { getCanonicalUrl, getHreflangTags } from "~/lib/utils";
import { getLocale } from "~/middlewares/i18next";
import type { Route } from "./+types/feedback";

const feedbackCategories = ["bug", "idea", "question", "other"] as const;

type FeedbackCategory = (typeof feedbackCategories)[number];

export const meta: Route.MetaFunction = ({ loaderData, params }) => {
  const locale = loaderData?.locale ?? params.locale ?? "en";

  return [
    { title: "Feedback" },
    {
      name: "description",
      content: "Share product feedback, questions, and suggestions.",
    },
    {
      tagName: "link",
      rel: "canonical",
      href: getCanonicalUrl(locale, "/feedback", loaderData?.appUrl),
    },
    ...getHreflangTags("/feedback", loaderData?.appUrl),
  ];
};

export async function loader({ context }: Route.LoaderArgs) {
  return {
    appUrl: getPublicEnv().APP_URL,
    locale: getLocale(context),
  };
}

export default function FeedbackRoute() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [hasEditedEmail, setHasEditedEmail] = useState(false);

  const createFeedback = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success(t("feedback.success"));
      setCategory("idea");
      setMessage("");
      setEmail(user?.email ?? "");
      setHasEditedEmail(false);
    },
    onError: () => {
      toast.error(t("feedback.error"));
    },
  });

  useEffect(() => {
    if (user?.email && !hasEditedEmail) {
      setEmail(user.email);
    }
  }, [hasEditedEmail, user?.email]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createFeedback.mutate({
      email,
      category,
      message,
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-28 pb-20 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(61,58,57,0.14)_1px,transparent_1px),linear-gradient(180deg,rgba(61,58,57,0.12)_1px,transparent_1px)] bg-[size:80px_80px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(0,217,146,0.16),transparent_58%)]" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg border bg-card text-primary shadow-[0_0_15px_rgba(92,88,85,0.16)]">
            <MessageCircleMore className="size-6" />
          </div>
          <p className="mt-6 font-semibold text-primary text-sm uppercase tracking-[0.24em]">
            {t("feedback.eyebrow")}
          </p>
          <h1 className="mt-4 text-balance font-display font-normal text-4xl text-foreground tracking-[-0.02em] sm:text-5xl">
            {t("feedback.title")}
          </h1>
          <p className="mt-5 text-balance text-muted-foreground text-lg leading-8">
            {t("feedback.description")}
          </p>
        </section>

        <section className="mx-auto w-full max-w-2xl rounded-lg border bg-card p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_24px_rgba(0,217,146,0.08)] sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-email" className="text-foreground">
                {t("feedback.emailLabel")}
              </Label>
              <Input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setHasEditedEmail(true);
                }}
                placeholder={t("feedback.emailPlaceholder")}
                autoComplete="email"
                maxLength={255}
                required
                className="bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-category" className="text-foreground">
                {t("feedback.categoryLabel")}
              </Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value as FeedbackCategory);
                }}
              >
                <SelectTrigger
                  id="feedback-category"
                  aria-label={t("feedback.categoryLabel")}
                  className="w-full bg-background text-foreground focus-visible:border-primary focus-visible:ring-primary/30"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  <SelectGroup>
                    {feedbackCategories.map((item) => (
                      <SelectItem
                        key={item}
                        value={item}
                        className="focus:bg-primary focus:text-primary-foreground"
                      >
                        {t(`feedback.categories.${item}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-message" className="text-foreground">
                {t("feedback.messageLabel")}
              </Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
                placeholder={t("feedback.messagePlaceholder")}
                className="min-h-40 resize-y bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30"
                maxLength={2000}
                required
              />
              <p className="text-muted-foreground text-sm">
                {t("feedback.messageHint")}
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={createFeedback.isPending}
              className="w-full border border-primary/70 bg-primary font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,217,146,0.18)] hover:bg-primary/90 hover:text-primary-foreground"
            >
              <Send data-icon="inline-start" />
              {createFeedback.isPending
                ? t("feedback.submitting")
                : t("feedback.submit")}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
