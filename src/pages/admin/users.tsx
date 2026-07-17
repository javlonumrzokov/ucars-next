import { useMutation, useQuery } from '@apollo/client/react';
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { formatDate } from '@/lib/date-format';
import {
  ADMIN_DELETE_USER_MUTATION,
  ADMIN_UPDATE_USER_ROLE_MUTATION,
  ADMIN_USERS_QUERY,
} from '@/lib/graphql/queries';
import { useAuth } from '@/contexts/auth-context';

const ROLES = ['USER', 'DEALER', 'ADMIN'] as const;
type Role = (typeof ROLES)[number];

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

const roleBadge: Record<Role, string> = {
  USER: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  DEALER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const router = useRouter();
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, loading, refetch } = useQuery<{
    adminUsers: { items: AdminUser[]; total: number; page: number; totalPages: number };
  }>(ADMIN_USERS_QUERY, {
    variables: { page, limit: 15, search: search || undefined, role: roleFilter || undefined },
    fetchPolicy: 'network-only',
  });

  const [updateRole] = useMutation(ADMIN_UPDATE_USER_ROLE_MUTATION, {
    onCompleted: () => refetch(),
  });
  const [deleteUser] = useMutation(ADMIN_DELETE_USER_MUTATION, {
    onCompleted: () => refetch(),
  });

  const users = data?.adminUsers?.items ?? [];
  const totalPages = data?.adminUsers?.totalPages ?? 1;
  const total = data?.adminUsers?.total ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    await updateRole({ variables: { id: userId, role } });
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(t('users.deleteConfirm', { name }))) return;
    await deleteUser({ variables: { id: userId } });
  };

  return (
    <AdminLayout title={t('users.title')}>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
          >
            {t('users.search')}
          </button>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">{t('users.allRoles')}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t(`enums.role.${r}`, { defaultValue: r })}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('users.userCount', { count: total })}</p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse gap-4">
                <div className="h-4 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">{t('users.noUsersFound')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">{t('users.colName')}</th>
                  <th className="px-5 py-3">{t('users.colEmail')}</th>
                  <th className="px-5 py-3">{t('users.colRole')}</th>
                  <th className="px-5 py-3">{t('users.colJoined')}</th>
                  <th className="px-5 py-3">{t('users.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">
                      {u.name}
                      {u._id === me?._id && (
                        <span className="ml-2 text-xs text-zinc-400">{t('users.you')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        disabled={u._id === me?._id}
                        onChange={(e) => handleRoleChange(u._id, e.target.value as Role)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none disabled:opacity-60 ${roleBadge[u.role]}`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{t(`enums.role.${r}`, { defaultValue: r })}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(u.createdAt, router.locale)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        disabled={u._id === me?._id}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                      >
                        {t('users.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700">
            {t('users.prev')}
          </button>
          <span className="text-sm text-zinc-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700">
            {t('users.next')}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'en', ['admin'])) },
});
