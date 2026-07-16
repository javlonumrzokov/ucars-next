import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  ADMIN_ARTICLES_QUERY,
  ADMIN_USERS_QUERY,
  ADMIN_VEHICLES_QUERY,
} from '@/lib/graphql/queries';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

function StatCard({ label, value, icon, color, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="mt-0.5 text-3xl font-bold text-zinc-900 dark:text-white">
          {value ?? '—'}
        </p>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: usersData } = useQuery(ADMIN_USERS_QUERY, {
    variables: { page: 1, limit: 1 },
    fetchPolicy: 'network-only',
  });
  const { data: vehiclesData } = useQuery(ADMIN_VEHICLES_QUERY, {
    variables: { page: 1, limit: 1 },
    fetchPolicy: 'network-only',
  });
  const { data: articlesData } = useQuery(ADMIN_ARTICLES_QUERY, {
    variables: { page: 1, limit: 1 },
    fetchPolicy: 'network-only',
  });

  const totalUsers = usersData?.adminUsers?.total ?? '…';
  const totalVehicles = vehiclesData?.adminVehicles?.total ?? '…';
  const totalArticles = articlesData?.adminArticles?.total ?? '…';

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Users"
          value={totalUsers}
          href="/admin/users"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Total Vehicles"
          value={totalVehicles}
          href="/admin/vehicles"
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          }
        />
        <StatCard
          label="Total Articles"
          value={totalArticles}
          href="/admin/articles"
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          icon={
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-white">Quick Links</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage your platform from the sidebar.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { href: '/admin/users', label: 'Manage Users' },
            { href: '/admin/vehicles', label: 'Manage Vehicles' },
            { href: '/admin/articles', label: 'Manage Articles' },
            { href: '/', label: 'View Site ↗' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
