import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';
import VehicleCard from '@/components/ui/VehicleCard';
import { VEHICLES_QUERY } from '@/lib/graphql/queries';
import type { Paginated, Vehicle } from '@/types';

interface Data {
  vehicles: Paginated<Vehicle>;
}

export default function HomePage() {
  const { data, loading } = useQuery<Data>(VEHICLES_QUERY, {
    variables: { inquiry: { page: 1, limit: 6, search: {} } },
  });

  const vehicles = (data?.vehicles?.items ?? []) as Vehicle[];

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <Container className="py-20 sm:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                Marketplace · New & Used
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
                Find the car
                <br />
                <span className="text-zinc-500 dark:text-zinc-400">you&apos;ll love.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base text-zinc-600 dark:text-zinc-400">
                Browse thousands of verified listings from trusted dealers.
                Compare, chat, and buy — all in one place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Browse vehicles
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-900"
                >
                  Read the blog
                </Link>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                <Stat label="Listings" value="10k+" />
                <Stat label="Dealers" value="500+" />
                <Stat label="Cities" value="80+" />
              </dl>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-zinc-200/40 blur-3xl dark:bg-zinc-800/40" />
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
                  alt="Featured car"
                  className="h-[460px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                Featured vehicles
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Hand-picked listings from this week.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:block dark:text-zinc-300 dark:hover:text-white"
            >
              View all →
            </Link>
          </div>

          {loading && vehicles.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900"
                />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No vehicles yet. Check back soon.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v: Vehicle) => (
                <VehicleCard key={v._id} vehicle={v} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-16 sm:py-20 dark:border-zinc-800 dark:bg-zinc-900/40">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            <Feature
              title="Verified dealers"
              description="Every dealer is reviewed before they can list a car."
            />
            <Feature
              title="Real-time chat"
              description="Message dealers instantly and negotiate with confidence."
            />
            <Feature
              title="Social follow"
              description="Follow dealers and favorite listings to keep tabs on prices."
            />
          </div>
        </Container>
      </section>
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
