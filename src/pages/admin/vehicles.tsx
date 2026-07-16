import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const statusBadge: Record<VehicleStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SOLD: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  DELETE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminVehiclesPage() {
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
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    await deleteVehicle({ variables: { id } });
  };

  return (
    <AdminLayout title="Vehicles">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search brand or model…"
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button type="submit"
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{total} vehicle{total !== 1 ? 's' : ''}</p>
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
          <p className="px-5 py-10 text-center text-sm text-zinc-400">No vehicles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Views / Likes</th>
                  <th className="px-5 py-3">Listed</th>
                  <th className="px-5 py-3">Actions</th>
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
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{formatPrice(v.vehiclePrice)}</td>
                    <td className="px-5 py-3">
                      <select
                        value={v.vehicleStatus}
                        onChange={(e) => handleStatusChange(v._id, e.target.value as VehicleStatus)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none ${statusBadge[v.vehicleStatus]}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                      {v.vehicleViews} / {v.vehicleLikes}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(v.createdAt)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(v._id, `${v.vehicleBrand} ${v.vehicleModel}`)}
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
