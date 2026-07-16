import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';
import LikeButton from '@/components/ui/LikeButton';
import { ARTICLES_QUERY } from '@/lib/graphql/queries';
import type { Article, Paginated } from '@/types';

interface ArticlesData {
  articles: Paginated<Article>;
}

const LIMIT = 9;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function excerpt(content: string, max = 160) {
  const plain = content.replace(/<[^>]*>/g, '');
  return plain.length > max ? plain.slice(0, max).trimEnd() + '…' : plain;
}

export default function BlogPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, loading } = useQuery<ArticlesData>(ARTICLES_QUERY, {
    variables: { page, limit: LIMIT, search: activeSearch || undefined, tag: activeTag || undefined },
    fetchPolicy: 'cache-and-network',
  });

  const articles = data?.articles.items ?? [];
  const total = data?.articles.total ?? 0;
  const totalPages = data?.articles.totalPages ?? 1;

  // Collect all tags from current results for the tag filter
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags))).sort();

  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveSearch(val);
      setPage(1);
    }, 400);
  }

  function handleTagClick(tag: string) {
    setActiveTag((prev) => (prev === tag ? '' : tag));
    setPage(1);
  }

  // Read tag from URL query param (e.g. /blog?tag=tips)
  useEffect(() => {
    if (router.query.tag) setActiveTag(router.query.tag as string);
  }, [router.query.tag]);

  return (
    <Layout>
      <Container className="py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Blog
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total > 0 ? `${total} articles` : 'Latest articles and guides'}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setActiveSearch(search);
                setPage(1);
                setSearch('');
                searchRef.current?.focus();
              }
            }}
            placeholder="Search articles…"
            className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 shadow-sm placeholder-zinc-400 transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-white dark:focus:ring-white/10"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setActiveSearch(''); setPage(1); }}
              className="absolute inset-y-0 right-3 flex items-center px-2 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeTag === tag
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                    : 'border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
            {activeTag && (
              <button
                onClick={() => setActiveTag('')}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Clear tag
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {loading && articles.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="aspect-[16/9] rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-16 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">No articles found.</p>
            {(activeSearch || activeTag) && (
              <button
                onClick={() => { setSearch(''); setActiveSearch(''); setActiveTag(''); setPage(1); }}
                className="mt-3 text-sm font-medium text-zinc-900 hover:underline dark:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ← Prev
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Next →
            </button>
          </div>
        )}
      </Container>
    </Layout>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Cover */}
      <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h2 className="line-clamp-2 text-base font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-white dark:group-hover:text-zinc-300">
          {article.title}
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {excerpt(article.content)}
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>{formatDate(article.createdAt)}</span>
          <div className="flex items-center gap-3">
            <span>👁 {article.viewCount}</span>
            <LikeButton
              targetType="ARTICLE"
              targetId={article._id}
              likeCount={article.likeCount}
              size="sm"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
