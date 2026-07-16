import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';
import CommentSection from '@/components/ui/CommentSection';
import FollowButton from '@/components/ui/FollowButton';
import LikeButton from '@/components/ui/LikeButton';
import { ARTICLE_QUERY } from '@/lib/graphql/queries';
import type { Article } from '@/types';

interface ArticleData {
  article: Article;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, loading, error } = useQuery<ArticleData>(ARTICLE_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <Layout>
        <Container className="max-w-3xl py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="aspect-[16/7] w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-4 rounded bg-zinc-100 dark:bg-zinc-800 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
              ))}
            </div>
          </div>
        </Container>
      </Layout>
    );
  }

  if (error || !data?.article) {
    return (
      <Layout>
        <Container className="max-w-3xl py-10">
          <div className="rounded-xl border border-dashed border-zinc-300 p-16 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">Article not found.</p>
            <Link
              href="/blog"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-white"
            >
              ← Back to blog
            </Link>
          </div>
        </Container>
      </Layout>
    );
  }

  const a = data.article;

  return (
    <Layout>
      <Container className="max-w-3xl py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-white">
            Blog
          </Link>
          <span>/</span>
          <span className="line-clamp-1 text-zinc-900 dark:text-white">{a.title}</span>
        </nav>

        {/* Cover */}
        {a.coverImage && (
          <div className="mb-8 aspect-[16/7] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.coverImage}
              alt={a.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Tags */}
        {a.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {a.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold leading-snug tracking-tight text-zinc-900 dark:text-white">
          {a.title}
        </h1>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{formatDate(a.createdAt)}</span>
          <span>·</span>
          <span>👁 {a.viewCount} views</span>
          <LikeButton
            targetType="ARTICLE"
            targetId={a._id}
            likeCount={a.likeCount}
            size="md"
          />
          <FollowButton userId={a.author} size="sm" />
        </div>

        {/* Divider */}
        <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

        {/* Content */}
        <div
          className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-zinc-900 dark:prose-a:text-white prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: a.content }}
        />

        {/* Comments */}
        <CommentSection targetType="ARTICLE" targetId={a._id} />

        {/* Bottom nav */}
        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            ← Back to blog
          </Link>
        </div>
      </Container>
    </Layout>
  );
}
