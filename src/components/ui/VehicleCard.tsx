import Link from 'next/link';
import LikeButton from '@/components/ui/LikeButton';
import type { Vehicle } from '@/types';

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  SOLD: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  DELETE: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
};

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

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const cover = vehicle.vehicleImages?.[0];
  const label = vehicle.vehicleCategory === 'NEW' ? 'NEW' : vehicle.vehicleCategory === 'USED' ? 'USED' : '';

  return (
    <Link
      href={`/products/${vehicle._id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={`${vehicle.vehicleBrand} ${vehicle.vehicleModel}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {label && (
            <span className="rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs font-semibold text-white">
              {label}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[vehicle.vehicleStatus] ?? statusBadge.ACTIVE}`}>
            {vehicle.vehicleStatus}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-white">
            {vehicle.vehicleBrand} {vehicle.vehicleModel}
          </h3>
          <span className="shrink-0 text-base font-bold text-zinc-900 dark:text-white">
            {formatPrice(vehicle.vehiclePrice)}
          </span>
        </div>

        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {vehicle.vehicleType} · {vehicle.vehicleMadeYear}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
            {vehicle.vehicleFuel}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
            {vehicle.vehicleGearbox}
          </span>
          <span className="ml-auto">{formatMileage(vehicle.vehicleMileage)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="line-clamp-1">{vehicle.vehicleAddress}</span>
          <LikeButton
            targetType="VEHICLE"
            targetId={vehicle._id}
            likeCount={vehicle.vehicleLikes}
            size="sm"
          />
        </div>
      </div>
    </Link>
  );
}
