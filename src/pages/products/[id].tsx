import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';
import CommentSection from '@/components/ui/CommentSection';
import FollowButton from '@/components/ui/FollowButton';
import LikeButton from '@/components/ui/LikeButton';
import { useAuth } from '@/contexts/auth-context';
import { useChat } from '@/contexts/chat-context';
import { VEHICLE_QUERY } from '@/lib/graphql/queries';
import type { Vehicle } from '@/types';

interface VehicleData {
  vehicle: Vehicle;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMileage(value: number) {
  return new Intl.NumberFormat('en-US').format(value) + ' km';
}

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SOLD: 'bg-zinc-200 text-zinc-600',
  DELETE: 'bg-red-100 text-red-600',
};

export default function VehicleDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [activeImage, setActiveImage] = useState(0);
  const { isAuthenticated } = useAuth();
  const { openPrivateChatWith } = useChat();

  const { data, loading, error } = useQuery<VehicleData>(VEHICLE_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <Layout>
        <Container className="py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="aspect-[16/9] w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800 lg:col-span-2" />
              <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </Container>
      </Layout>
    );
  }

  if (error || !data?.vehicle) {
    return (
      <Layout>
        <Container className="py-10">
          <div className="rounded-xl border border-dashed border-zinc-300 p-16 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">Vehicle not found.</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-white"
            >
              ← Back to listings
            </Link>
          </div>
        </Container>
      </Layout>
    );
  }

  const v = data.vehicle;
  const images = v.vehicleImages?.length ? v.vehicleImages : [];

  return (
    <Layout>
      <Container className="py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/products" className="hover:text-zinc-900 dark:hover:text-white">
            Vehicles
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-white">
            {v.vehicleBrand} {v.vehicleModel}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left — images */}
          <div className="lg:col-span-3">
            {/* Main image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              {images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[activeImage]}
                  alt={`${v.vehicleBrand} ${v.vehicleModel}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  No image available
                </div>
              )}
              <div className="absolute left-3 top-3 flex gap-2">
                <span className="rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-white">
                  {v.vehicleCategory}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[v.vehicleStatus] ?? statusBadge.ACTIVE}`}>
                  {v.vehicleStatus}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      i === activeImage
                        ? 'border-zinc-900 dark:border-white'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            {v.vehicleDesc && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Description
                </h2>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {v.vehicleDesc}
                </p>
              </div>
            )}
          </div>

          {/* Right — info panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              {/* Title + price */}
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {v.vehicleBrand} {v.vehicleModel}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {v.vehicleType} · {v.vehicleMadeYear}
              </p>
              <p className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white">
                {formatPrice(v.vehiclePrice)}
              </p>

              {/* Specs grid */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Spec label="Fuel" value={v.vehicleFuel} />
                <Spec label="Gearbox" value={v.vehicleGearbox} />
                <Spec label="Mileage" value={formatMileage(v.vehicleMileage)} />
                <Spec label="Year" value={String(v.vehicleMadeYear)} />
                <Spec label="Type" value={v.vehicleType} />
                <Spec label="Category" value={v.vehicleCategory} />
              </div>

              {/* Location */}
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {v.vehicleAddress}
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span>👁 {v.vehicleViews} views</span>
                <LikeButton
                  targetType="VEHICLE"
                  targetId={v._id}
                  likeCount={v.vehicleLikes}
                  size="md"
                />
              </div>

              {/* CTA */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (!isAuthenticated) { router.push('/login'); return; }
                    openPrivateChatWith(v.memberId);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Message Dealer
                </button>
                <FollowButton userId={v.memberId} size="md" className="w-full justify-center" />
              </div>

              <Link
                href="/products"
                className="mt-3 flex items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                ← Back to listings
              </Link>
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentSection targetType="VEHICLE" targetId={v._id} />
      </Container>
    </Layout>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}
