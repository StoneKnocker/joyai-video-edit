import { BlogList } from "~/components/blog/blog-list";
import { type BlogCopy, getBlogCopy, getBlogPosts } from "~/lib/blog";
import { getPublicEnv } from "~/lib/env.server";
import { getCanonicalUrl, getHreflangTags } from "~/lib/utils";
import { getLocale } from "~/middlewares/i18next";
import type { BlogPost } from "~/types/blog";
import type { Route } from "./+types/blog";

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) {
    return [{ title: "Blog" }];
  }

  return [
    { title: loaderData.copy.title },
    { name: "description", content: loaderData.copy.description },
    {
      tagName: "link",
      rel: "canonical",
      href: getCanonicalUrl(loaderData.locale, "/blog", loaderData.appUrl),
    },
    ...getHreflangTags("/blog", loaderData.appUrl),
  ];
};

export async function loader({ context }: Route.LoaderArgs) {
  const locale = getLocale(context);
  const copy = getBlogCopy(locale);
  const posts = await getBlogPosts(locale);

  return {
    appUrl: getPublicEnv().APP_URL,
    copy,
    locale,
    posts,
  };
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden bg-background pt-28 pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(61,58,57,0.14)_1px,transparent_1px),linear-gradient(180deg,rgba(61,58,57,0.12)_1px,transparent_1px)] bg-[size:80px_80px] opacity-35" />
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <div className="relative rounded-lg border bg-card px-8 py-14 shadow-[0_0_15px_rgba(92,88,85,0.16)]">
          <p className="font-semibold text-2xl text-foreground">{title}</p>
          <p className="mt-4 text-muted-foreground leading-7">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function BlogRoute({ loaderData }: Route.ComponentProps) {
  const { copy, posts } = loaderData as {
    copy: BlogCopy;
    posts: BlogPost[];
  };

  if (!posts.length) {
    return (
      <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
    );
  }

  return (
    <BlogList
      articleEyebrow={copy.articleEyebrow}
      title={copy.title}
      readMoreLabel={copy.readMore}
      posts={posts}
    />
  );
}
