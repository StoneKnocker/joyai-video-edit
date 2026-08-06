import { ArrowRight } from "lucide-react";
import { Link } from "~/components/i18n-link";
import type { BlogPost } from "~/types/blog";

function BlogCard({
  articleEyebrow,
  post,
  readMoreLabel,
}: {
  articleEyebrow: string;
  post: BlogPost;
  readMoreLabel: string;
}) {
  const href = `/blog/${post.slug}`;

  return (
    <Link
      to={href}
      className="group hover:-translate-y-1 relative flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-[0_0_15px_rgba(92,88,85,0.16)] transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_24px_rgba(0,217,146,0.14)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {post.cover ? (
          <img
            src={post.cover}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(0,217,146,0.18),_transparent_46%),linear-gradient(135deg,_rgba(5,5,7,0.94),_rgba(16,16,16,0.98))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,5,7,0.72))]" />
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        <p className="mb-3 font-medium text-primary text-[11px] uppercase tracking-[0.26em]">
          {articleEyebrow}
        </p>
        <h2 className="mb-3 text-balance font-semibold text-2xl text-foreground leading-tight">
          {post.title}
        </h2>
        <p className="mb-6 flex-1 text-muted-foreground text-[15px] leading-7">
          {post.description}
        </p>
        <span className="inline-flex items-center gap-2 font-semibold text-primary text-sm transition-colors group-hover:text-primary">
          {readMoreLabel}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function BlogList({
  articleEyebrow,
  title,
  readMoreLabel,
  posts,
}: {
  articleEyebrow: string;
  title: string;
  readMoreLabel: string;
  posts: BlogPost[];
}) {
  return (
    <div className="relative overflow-hidden bg-background pt-28 pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(61,58,57,0.14)_1px,transparent_1px),linear-gradient(180deg,rgba(61,58,57,0.12)_1px,transparent_1px)] bg-[size:80px_80px] opacity-35" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(0,217,146,0.12),_transparent_60%)]" />

      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight md:text-5xl">
            {title}
          </h1>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              post={post}
              readMoreLabel={readMoreLabel}
              articleEyebrow={articleEyebrow}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
