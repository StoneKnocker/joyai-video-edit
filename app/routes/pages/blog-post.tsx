import { BlogDetail } from "~/components/blog/blog-detail";
import { getBlogLabels, getRequiredBlogPost } from "~/lib/blog";
import { getPublicEnv } from "~/lib/env.server";
import { getCanonicalUrl, getHreflangTags } from "~/lib/utils";
import { getLocale } from "~/middlewares/i18next";
import type { BlogPost } from "~/types/blog";
import type { Route } from "./+types/blog-post";

export const meta: Route.MetaFunction = ({ loaderData, params }) => {
  if (!loaderData) {
    return [{ title: params.slug || "Article" }];
  }

  return [
    { title: loaderData.post.title },
    {
      name: "description",
      content: loaderData.post.description || loaderData.post.title,
    },
    {
      tagName: "link",
      rel: "canonical",
      href: getCanonicalUrl(
        loaderData.locale,
        `/blog/${loaderData.post.slug}`,
        loaderData.appUrl,
      ),
    },
    ...getHreflangTags(`/blog/${loaderData.post.slug}`, loaderData.appUrl),
  ];
};

export async function loader({ context, params }: Route.LoaderArgs) {
  const locale = getLocale(context);
  const slug = params.slug;

  if (!slug) {
    throw new Response("Blog article not found", { status: 404 });
  }

  const post = await getRequiredBlogPost(locale, slug);

  return {
    appUrl: getPublicEnv().APP_URL,
    locale,
    post,
    labels: getBlogLabels(locale),
  };
}

export default function BlogSlugRoute({ loaderData }: Route.ComponentProps) {
  const { post, labels } = loaderData as {
    labels: {
      articleEyebrow: string;
      backToList: string;
      blog: string;
      home: string;
    };
    post: BlogPost;
  };

  return (
    <BlogDetail
      articleEyebrow={labels.articleEyebrow}
      backToListLabel={labels.backToList}
      post={post}
      blogLabel={labels.blog}
      homeLabel={labels.home}
    />
  );
}
