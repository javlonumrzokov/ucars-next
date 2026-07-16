import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  ADMIN_ARTICLES_QUERY,
  ADMIN_DELETE_ARTICLE_MUTATION,
} from '@/lib/graphql/queries';

interface AdminArticle {
  _id: string;
  title: string;
  author: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminArticlesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, loading, refetch } = useQuery<{
    adminArticles: { items: AdminArticle[]; total: number; page: number; totalPages: number };
  }>(ADMIN_ARTICLES_QUERY, {
    variables: { page, limit: 15, search: search || undefined },
    fetchPolicy: 'network-only',
  });

  const [deleteArticle] = useMutation(ADMIN_DELETE_ARTICLE_MUTATION, {
    onCompleted: () => refetch(),
  });

  const articles = data?.adminArticles?.items ?? [];
  const totalPages = data?.adminArticles?.totalPages ?? 1;
  const total = data?.adminArticles?.total ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete article "${title}"? This cannot be undone.`)) return;
    await deleteArticle({ variables: { id } });
  };

  return (
    <AdminLayout title="Articles">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title…"
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button type="submit"
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{total} article{total !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse gap-4">
                <div className="h-4 w-2/5 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-1/5 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">No articles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Author ID</th>
                  <th className="px-5 py-3">Views / Likes</th>
                  <th className="px-5 py-3">Published</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {articles.map((a) => (
                  <tr key={a._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="max-w-xs px-5 py-3 font-medium text-zinc-900 dark:text-white">
                      <Link href={`/blog/${a._id}`} className="line-clamp-1 hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {a.author.slice(-8)}…
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                      {a.viewCount} / {a.likeCount}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(a.createdAt)}</td>
                    <td className="px-5 py-3 flex items-center gap-2">
                      <Link
                        href={`/blog/${a._id}`}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(a._id, a.title)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700">
            ← Prev
          </button>
          <span className="text-sm text-zinc-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700">
            Next →
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
