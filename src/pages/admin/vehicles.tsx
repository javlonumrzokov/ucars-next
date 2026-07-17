import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { formatDate, toBcp47 } from '@/lib/date-format';
import {
  ADMIN_CHANGE_VEHICLE_STATUS_MUTATION,
  ADMIN_DELETE_VEHICLE_MUTATION,
  ADMIN_VEHICLES_QUERY,
} from '@/lib/graphql/queries';

const STATUSES = ['ACTIVE', 'SOLD', 'DELETE'] as const;
type VehicleStatus = (typeof STATUSES)[number];

interface AdminVehicle {
  _id: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleStatus: VehicleStatus;
  vehiclePrice: number;
  vehicleViews: number;
  vehicleLikes: number;
  memberId: string;
  createdAt: string;
}

function formatPrice(value: number, locale?: string) {
  return new Intl.NumberFormat(toBcp47(locale), { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const statusBadge: Record<VehicleStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SOLD: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  DELETE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminVehiclesPage() {
  const { t } = useTranslation('admin');
  const { t: tp } = useTranslation('products');
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, refetch } = useQuery<{
    adminVehicles: { items: AdminVehicle[]; total: number; page: number; totalPages: number };
  }>(ADMIN_VEHICLES_QUERY, {
    variables: { page, limit: 15, search: search || undefined, status: statusFilter || undefined },
    fetchPolicy: 'network-only',
  });

  const [changeStatus] = useMutation(ADMIN_CHANGE_VEHICLE_STATUS_MUTATION, {
    onCompleted: () => refetch(),
  });
  const [deleteVehicle] = useMutation(ADMIN_DELETE_VEHICLE_MUTATION, {
    onCompleted: () => refetch(),
  });

  const vehicles = data?.adminVehicles?.items ?? [];
  const totalPages = data?.adminVehicles?.totalPages ?? 1;
  const total = data?.adminVehicles?.total ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = async (id: string, status: VehicleStatus) => {
    await changeStatus({ variables: { id, status } });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('vehicles.deleteConfirm', { name }))) return;
    await deleteVehicle({ variables: { id } });
  };

  return (
    <AdminLayout title={t('vehicles.title')}>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('vehicles.searchPlaceholder')}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button type="submit"
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
            {t('vehicles.search')}
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">{t('vehicles.allStatuses')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{tp(`enums.status.${s}`, { defaultValue: s })}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('vehicles.vehicleCount', { count: total })}</p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse gap-4">
                <div className="h-4 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-1/5 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">{t('vehicles.noVehiclesFound')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">{t('vehicles.colVehicle')}</th>
                  <th className="px-5 py-3">{t('vehicles.colPrice')}</th>
                  <th className="px-5 py-3">{t('vehicles.colStatus')}</th>
                  <th className="px-5 py-3">{t('vehicles.colViewsLikes')}</th>
                  <th className="px-5 py-3">{t('vehicles.colListed')}</th>
                  <th className="px-5 py-3">{t('vehicles.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">
                      <Link href={`/products/${v._id}`} className="hover:underline">
                        {v.vehicleBrand} {v.vehicleModel}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{formatPrice(v.vehiclePrice, router.locale)}</td>
                    <td className="px-5 py-3">
                      <select
                        value={v.vehicleStatus}
                        onChange={(e) => handleStatusChange(v._id, e.target.value as VehicleStatus)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none ${statusBadge[v.vehicleStatus]}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{tp(`enums.status.${s}`, { defaultValue: s })}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                      {v.vehicleViews} / {v.vehicleLikes}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(v.createdAt, router.locale)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(v._id, `${v.vehicleBrand} ${v.vehicleModel}`)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {t('vehicles.delete')}
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
            {t('vehicles.prev')}
          </button>
          <span className="text-sm text-zinc-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700">
            {t('vehicles.next')}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'en', ['admin', 'products'])) },
});
