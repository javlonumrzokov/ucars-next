import { useQuery } from '@apollo/client/react';
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';
import VehicleCard from '@/components/ui/VehicleCard';
import { SMART_SEARCH_QUERY, VEHICLES_QUERY } from '@/lib/graphql/queries';
import type {
  Paginated,
  Vehicle,
  VehicleBrand,
  VehicleCategory,
  VehicleFuel,
  VehicleGearbox,
  VehicleType,
} from '@/types';

const BRANDS: VehicleBrand[] = ['AUDI','BMW','FORD','MERCEDES','PEUGEOT','VOLKSWAGEN','BENTLEY','NISSAN','JEEP','TOYOTA','KIA','HYUNDAI'];
const TYPES: VehicleType[] = ['SUV','SEDAN','HATCHBACK','COUPE','HYBRID','CONVERTIBLE','VAN','TRUCK','ELECTRIC'];
const FUELS: VehicleFuel[] = ['PETROL','DIESEL','GAS','EV','HYBRID'];
const GEARBOXES: VehicleGearbox[] = ['AUTOMATIC','MANUAL','CVT'];
const CATEGORIES: VehicleCategory[] = ['ALL','NEW','USED'];

const LIMIT = 12;

interface Filters {
  categoryList: VehicleCategory[];
  typeList: VehicleType[];
  brandList: VehicleBrand[];
  fuelList: VehicleFuel[];
  gearboxList: VehicleGearbox[];
  minPrice: string;
  maxPrice: string;
}

const DEFAULT_FILTERS: Filters = {
  categoryList: [],
  typeList: [],
  brandList: [],
  fuelList: [],
  gearboxList: [],
  minPrice: '',
  maxPrice: '',
};

interface VehiclesData { vehicles: Paginated<Vehicle> }
interface SmartData { smartSearch: Paginated<Vehicle> }

export default function ProductsPage() {
  const { t } = useTranslation('products');
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAiSearch = activeQuery.trim().length > 0;

  const buildInquiry = useCallback(() => ({
    page,
    limit: LIMIT,
    sort: 'createdAt',
    search: {
      ...(filters.categoryList.length ? { categoryList: filters.categoryList } : {}),
      ...(filters.typeList.length ? { typeList: filters.typeList } : {}),
      ...(filters.brandList.length ? { brandList: filters.brandList } : {}),
      ...(filters.fuelList.length ? { fuelList: filters.fuelList } : {}),
      ...(filters.gearboxList.length ? { gearboxList: filters.gearboxList } : {}),
      ...(filters.minPrice || filters.maxPrice
        ? { pricesRange: { start: Number(filters.minPrice) || 0, end: Number(filters.maxPrice) || 9999999 } }
        : {}),
    },
  }), [page, filters]);

  const { data: normalData, loading: normalLoading } = useQuery<VehiclesData>(VEHICLES_QUERY, {
    variables: { inquiry: buildInquiry() },
    skip: isAiSearch,
    fetchPolicy: 'cache-and-network',
  });

  const { data: aiData, loading: aiLoading } = useQuery<SmartData>(SMART_SEARCH_QUERY, {
    variables: { query: activeQuery, page, limit: LIMIT },
    skip: !isAiSearch,
    fetchPolicy: 'cache-and-network',
  });

  const paginated = isAiSearch ? aiData?.smartSearch : normalData?.vehicles;
  const vehicles = (paginated?.items ?? []) as Vehicle[];
  const totalPages = paginated?.totalPages ?? 1;
  const total = paginated?.total ?? 0;
  const loading = isAiSearch ? aiLoading : normalLoading;

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveQuery(val);
      setPage(1);
    }, 600);
  }

  function toggleArray<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function handleFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  const hasActiveFilters =
    filters.brandList.length > 0 ||
    filters.typeList.length > 0 ||
    filters.categoryList.length > 0 ||
    filters.fuelList.length > 0 ||
    filters.gearboxList.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '';

  return (
    <Layout>
      <Container className="py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {t('list.title')}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total > 0 ? t('list.vehiclesFound', { count: total }) : t('list.searchOrFilter')}
          </p>
        </div>

        {/* AI Search Bar */}
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <input
            ref={searchRef}
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setActiveQuery(searchInput);
                setPage(1);
                setSearchInput('');
                searchRef.current?.focus();
              }
            }}
            placeholder={t('list.searchPlaceholder')}
            className="w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-11 pr-4 text-sm text-zinc-900 shadow-sm placeholder-zinc-400 transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-white dark:focus:ring-white/10"
          />
          {isAiSearch && (
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-1.5">
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />}
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {t('list.aiTag')}
              </span>
            </div>
          )}
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setActiveQuery(''); setPage(1); }}
              className="absolute inset-y-0 right-12 flex items-center px-2 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              showFilters
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            {t('list.filters')}
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs text-white dark:bg-zinc-200 dark:text-zinc-900">
                !
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              {t('list.clearFilters')}
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Category */}
              <FilterGroup label={t('list.category')}>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c}
                    label={t(`enums.category.${c}`, { defaultValue: c })}
                    active={filters.categoryList.includes(c)}
                    onClick={() => handleFilterChange('categoryList', toggleArray(filters.categoryList, c))}
                  />
                ))}
              </FilterGroup>

              {/* Type */}
              <FilterGroup label={t('list.type')}>
                {TYPES.map((ty) => (
                  <Chip
                    key={ty}
                    label={t(`enums.type.${ty}`, { defaultValue: ty })}
                    active={filters.typeList.includes(ty)}
                    onClick={() => handleFilterChange('typeList', toggleArray(filters.typeList, ty))}
                  />
                ))}
              </FilterGroup>

              {/* Brand */}
              <FilterGroup label={t('list.brand')}>
                {BRANDS.map((b) => (
                  <Chip
                    key={b}
                    label={b}
                    active={filters.brandList.includes(b)}
                    onClick={() => handleFilterChange('brandList', toggleArray(filters.brandList, b))}
                  />
                ))}
              </FilterGroup>

              {/* Fuel */}
              <FilterGroup label={t('list.fuel')}>
                {FUELS.map((f) => (
                  <Chip
                    key={f}
                    label={t(`enums.fuel.${f}`, { defaultValue: f })}
                    active={filters.fuelList.includes(f)}
                    onClick={() => handleFilterChange('fuelList', toggleArray(filters.fuelList, f))}
                  />
                ))}
              </FilterGroup>

              {/* Gearbox */}
              <FilterGroup label={t('list.gearbox')}>
                {GEARBOXES.map((g) => (
                  <Chip
                    key={g}
                    label={t(`enums.gearbox.${g}`, { defaultValue: g })}
                    active={filters.gearboxList.includes(g)}
                    onClick={() => handleFilterChange('gearboxList', toggleArray(filters.gearboxList, g))}
                  />
                ))}
              </FilterGroup>

              {/* Price Range */}
              <FilterGroup label={t('list.priceRange')}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={t('list.min')}
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <span className="text-zinc-400">—</span>
                  <input
                    type="number"
                    placeholder={t('list.max')}
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </FilterGroup>
            </div>
          </div>
        )}

        {/* Results */}
        {loading && vehicles.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-16 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">{t('list.noVehiclesFound')}</p>
            {(hasActiveFilters || isAiSearch) && (
              <button
                onClick={() => { clearFilters(); setSearchInput(''); setActiveQuery(''); }}
                className="mt-3 text-sm font-medium text-zinc-900 hover:underline dark:text-white"
              >
                {t('list.clearAll')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
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
              {t('list.prev')}
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('list.pageOf', { page, totalPages })}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t('list.next')}
            </button>
          </div>
        )}
      </Container>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'en', ['common', 'chat', 'products'])) },
});

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
          : 'border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
