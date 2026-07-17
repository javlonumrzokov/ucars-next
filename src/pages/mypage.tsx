import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useEffect, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';
import FollowButton from '@/components/ui/FollowButton';
import VehicleCard from '@/components/ui/VehicleCard';
import { useAuth } from '@/contexts/auth-context';
import { getErrorMessage } from '@/lib/apollo-error';
import {
  CREATE_ARTICLE_MUTATION,
  CREATE_VEHICLE_MUTATION,
  FOLLOWERS_COUNT_QUERY,
  FOLLOWING_COUNT_QUERY,
  MY_ARTICLES_QUERY,
  MY_FOLLOWERS_QUERY,
  MY_FOLLOWING_QUERY,
  MY_LIKED_ARTICLES_QUERY,
  MY_LIKED_VEHICLES_QUERY,
  MY_RECENT_VIEWS_QUERY,
  MY_VEHICLES_QUERY,
  VEHICLES_BY_IDS_QUERY,
  ARTICLES_BY_IDS_QUERY,
} from '@/lib/graphql/queries';
import type { Article, Vehicle } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserPublicInfo { _id: string; name: string; email: string; role: string; avatar?: string | null; }
interface FollowWithUser { _id: string; user: UserPublicInfo; createdAt: string; }
interface RecentView { _id: string; targetType: 'VEHICLE' | 'ARTICLE'; targetId: string; createdAt: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-lg' };
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white dark:bg-white dark:text-zinc-900 ${sizes[size]}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function UserCard({ user }: { user: UserPublicInfo }) {
  const { t: ta } = useTranslation('admin');
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Avatar name={user.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{user.name}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{ta(`enums.role.${user.role}`, { defaultValue: user.role })}</p>
      </div>
      <FollowButton userId={user._id} size="sm" />
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  function excerpt(content: string) {
    const plain = content.replace(/<[^>]*>/g, '');
    return plain.length > 120 ? plain.slice(0, 120) + '…' : plain;
  }
  return (
    <Link href={`/blog/${article._id}`} className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverImage} alt={article.title} className="aspect-[16/7] w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-white">{article.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs text-zinc-500 dark:text-zinc-400">{excerpt(article.content)}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">#{t}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
      <p className="text-sm text-zinc-400">{msg}</p>
    </div>
  );
}

// ─── Create Article Form ───────────────────────────────────────────────────────

function CreateArticleForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('mypage');
  const [form, setForm] = useState({ title: '', content: '', tags: '' });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [createArticle, { loading }] = useMutation(CREATE_ARTICLE_MUTATION, {
    refetchQueries: [{ query: MY_ARTICLES_QUERY }],
  });

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ucar.token') : null;
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCoverImage(`${API_BASE_URL}${data.url}`);
    } catch {
      setError(t('articleForm.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  function toHtml(text: string): string {
    return text
      .split(/\n{2,}/)
      .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createArticle({
        variables: {
          input: {
            title: form.title,
            content: toHtml(form.content),
            coverImage: coverImage || undefined,
            tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          },
        },
      });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const field = 'w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-white';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('articleForm.titleLabel')}</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('articleForm.titlePlaceholder')} className={field} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('articleForm.coverLabel')}</label>
        {coverImage ? (
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="Cover" className="aspect-[16/6] w-full object-cover" />
            <button
              type="button"
              onClick={() => setCoverImage(null)}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
              {t('articleForm.remove')}
            </button>
          </div>
        ) : (
          <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition ${
            uploading ? 'border-zinc-300 opacity-60' : 'border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500'
          }`}>
            <svg className="h-8 w-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16l4-4a3 3 0 014.24 0L16 16m-2-2l1.59-1.59a3 3 0 014.24 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {uploading ? t('articleForm.uploading') : t('articleForm.clickToSelectCover')}
            </span>
            <input type="file" accept="image/*" disabled={uploading} onChange={handleCoverChange} className="hidden" />
          </label>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('articleForm.tagsLabel')}</label>
        <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder={t('articleForm.tagsPlaceholder')} className={field} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t('articleForm.contentLabel')}
          <span className="ml-1 font-normal text-zinc-400">{t('articleForm.contentHint')}</span>
        </label>
        <textarea required rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={t('articleForm.contentPlaceholder')} className={`${field} resize-y leading-relaxed`} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="submit" disabled={loading || uploading} className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
        {loading ? t('articleForm.publishing') : t('articleForm.publish')}
      </button>
    </form>
  );
}

// ─── Create Vehicle Form ───────────────────────────────────────────────────────

const VEHICLE_BRANDS = ['AUDI','BMW','FORD','MERCEDES','PEUGEOT','VOLKSWAGEN','BENTLEY','NISSAN','JEEP','TOYOTA','KIA','HYUNDAI'];
const VEHICLE_TYPES = ['SUV','SEDAN','HATCHBACK','COUPE','HYBRID','CONVERTIBLE','VAN','TRUCK','ELECTRIC'];
const VEHICLE_FUELS = ['PETROL','DIESEL','GAS','EV','HYBRID'];
const VEHICLE_GEARBOXES = ['AUTOMATIC','MANUAL','CVT'];
const VEHICLE_CATEGORIES = ['NEW','USED'];

function CreateVehicleForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('mypage');
  const { t: tp } = useTranslation('products');
  const [form, setForm] = useState({
    vehicleCategory: 'NEW', vehicleType: 'SUV', vehicleBrand: 'BMW',
    vehicleGearbox: 'AUTOMATIC', vehicleFuel: 'PETROL',
    vehicleModel: '', vehicleAddress: '', vehiclePrice: '',
    vehicleMileage: '', vehicleMadeYear: '', vehicleDesc: '',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [createVehicle, { loading }] = useMutation(CREATE_VEHICLE_MUTATION, {
    refetchQueries: [{ query: MY_VEHICLES_QUERY }],
  });

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ucar.token') : null;
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        urls.push(`${API_BASE_URL}${data.url}`);
      }
      setUploadedImages((prev) => [...prev, ...urls]);
    } catch {
      setError(t('vehicleForm.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setUploadedImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedImages.length) { setError(t('vehicleForm.needOneImage')); return; }
    setError('');
    try {
      await createVehicle({
        variables: {
          input: {
            vehicleCategory: form.vehicleCategory,
            vehicleType: form.vehicleType,
            vehicleBrand: form.vehicleBrand,
            vehicleGearbox: form.vehicleGearbox,
            vehicleFuel: form.vehicleFuel,
            vehicleModel: form.vehicleModel,
            vehicleAddress: form.vehicleAddress,
            vehiclePrice: Number(form.vehiclePrice),
            vehicleMileage: Number(form.vehicleMileage),
            vehicleMadeYear: Number(form.vehicleMadeYear),
            vehicleImages: uploadedImages,
            vehicleDesc: form.vehicleDesc || undefined,
          },
        },
      });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const field = 'w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white';
  const sel = (key: string, opts: string[], enumNs?: string) => (
    <select value={(form as Record<string, string>)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={field}>
      {opts.map((o) => (
        <option key={o} value={o}>
          {enumNs ? tp(`enums.${enumNs}.${o}`, { defaultValue: o }) : o}
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.category')}</label>{sel('vehicleCategory', VEHICLE_CATEGORIES, 'category')}</div>
        <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.type')}</label>{sel('vehicleType', VEHICLE_TYPES, 'type')}</div>
        <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.brand')}</label>{sel('vehicleBrand', VEHICLE_BRANDS)}</div>
        <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.gearbox')}</label>{sel('vehicleGearbox', VEHICLE_GEARBOXES, 'gearbox')}</div>
        <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.fuel')}</label>{sel('vehicleFuel', VEHICLE_FUELS, 'fuel')}</div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.modelLabel')}</label>
          <input required value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} placeholder={t('vehicleForm.modelPlaceholder')} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.addressLabel')}</label>
          <input required value={form.vehicleAddress} onChange={(e) => setForm({ ...form, vehicleAddress: e.target.value })} placeholder={t('vehicleForm.addressPlaceholder')} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.priceLabel')}</label>
          <input required type="number" min="0" value={form.vehiclePrice} onChange={(e) => setForm({ ...form, vehiclePrice: e.target.value })} placeholder="35000" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.mileageLabel')}</label>
          <input required type="number" min="0" value={form.vehicleMileage} onChange={(e) => setForm({ ...form, vehicleMileage: e.target.value })} placeholder="0" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.yearLabel')}</label>
          <input required type="number" min="1990" max="2030" value={form.vehicleMadeYear} onChange={(e) => setForm({ ...form, vehicleMadeYear: e.target.value })} placeholder="2024" className={field} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t('vehicleForm.photosLabel')} <span className="text-zinc-400">{t('vehicleForm.photosHint')}</span>
        </label>
        <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition ${
          uploading ? 'border-zinc-300 opacity-60' : 'border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500'
        }`}>
          <svg className="h-8 w-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 16l4-4a3 3 0 014.24 0L16 16m-2-2l1.59-1.59a3 3 0 014.24 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {uploading ? t('vehicleForm.uploading') : t('vehicleForm.clickToSelectPhotos')}
          </span>
          <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleImageChange} className="hidden" />
        </label>

        {uploadedImages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {uploadedImages.map((url) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-red-600"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('vehicleForm.descriptionLabel')}</label>
        <textarea rows={4} value={form.vehicleDesc} onChange={(e) => setForm({ ...form, vehicleDesc: e.target.value })} placeholder={t('vehicleForm.descriptionPlaceholder')} className={`${field} resize-y`} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="submit" disabled={loading || uploading} className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
        {loading ? t('vehicleForm.listing') : t('vehicleForm.listVehicle')}
      </button>
    </form>
  );
}

// ─── Sidebar nav config ────────────────────────────────────────────────────────

type Tab =
  | 'followers' | 'following' | 'liked' | 'my-articles'
  | 'write-article' | 'recent' | 'my-vehicles' | 'add-vehicle';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  count?: number;
  dealerOnly?: boolean;
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyPage() {
  const { t } = useTranslation('mypage');
  const { t: ta } = useTranslation('admin');
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('liked');
  const [articleDone, setArticleDone] = useState(false);
  const [vehicleDone, setVehicleDone] = useState(false);
  const formKey = useRef(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login?next=/mypage');
  }, [authLoading, isAuthenticated, router]);

  const isDealer = user?.role === 'DEALER' || user?.role === 'ADMIN';

  const { data: followersData } = useQuery<{ myFollowers: FollowWithUser[] }>(MY_FOLLOWERS_QUERY, { skip: !isAuthenticated });
  const { data: followingData } = useQuery<{ myFollowing: FollowWithUser[] }>(MY_FOLLOWING_QUERY, { skip: !isAuthenticated });
  const { data: followersCountData } = useQuery<{ followersCount: number }>(FOLLOWERS_COUNT_QUERY, { variables: { userId: user?._id }, skip: !user });
  const { data: followingCountData } = useQuery<{ followingCount: number }>(FOLLOWING_COUNT_QUERY, { variables: { userId: user?._id }, skip: !user });
  const { data: myArticlesData } = useQuery<{ myArticles: Article[] }>(MY_ARTICLES_QUERY, { skip: !isAuthenticated });
  const { data: myVehiclesData } = useQuery<{ myVehicles: Vehicle[] }>(MY_VEHICLES_QUERY, { skip: !isAuthenticated || !isDealer });
  const { data: likedVehiclesData } = useQuery<{ myLikedVehicles: Vehicle[] }>(MY_LIKED_VEHICLES_QUERY, { skip: !isAuthenticated });
  const { data: likedArticlesData } = useQuery<{ myLikedArticles: Article[] }>(MY_LIKED_ARTICLES_QUERY, { skip: !isAuthenticated });
  const { data: recentData } = useQuery<{ myRecentViews: RecentView[] }>(MY_RECENT_VIEWS_QUERY, { skip: !isAuthenticated });

  const recentViews = recentData?.myRecentViews ?? [];
  const vehicleRecentIds = recentViews.filter((v) => v.targetType === 'VEHICLE').map((v) => v.targetId);
  const articleRecentIds = recentViews.filter((v) => v.targetType === 'ARTICLE').map((v) => v.targetId);

  const { data: recentVehiclesData } = useQuery<{ vehiclesByIds: Vehicle[] }>(VEHICLES_BY_IDS_QUERY, {
    variables: { ids: vehicleRecentIds },
    skip: !isAuthenticated || vehicleRecentIds.length === 0,
  });

  const { data: recentArticlesData } = useQuery<{ articlesByIds: Article[] }>(ARTICLES_BY_IDS_QUERY, {
    variables: { ids: articleRecentIds },
    skip: !isAuthenticated || articleRecentIds.length === 0,
  });

  if (authLoading || !user) {
    return (
      <Layout>
        <Container className="py-20">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">{t('loading')}</p>
        </Container>
      </Layout>
    );
  }

  const followers = followersData?.myFollowers ?? [];
  const following = followingData?.myFollowing ?? [];
  const followersCount = followersCountData?.followersCount ?? 0;
  const followingCount = followingCountData?.followingCount ?? 0;
  const myArticles = myArticlesData?.myArticles ?? [];
  const myVehicles = myVehiclesData?.myVehicles ?? [];
  const likedVehicles = likedVehiclesData?.myLikedVehicles ?? [];
  const likedArticles = likedArticlesData?.myLikedArticles ?? [];
  const recentVehiclesById: Record<string, Vehicle> = {};
  for (const v of recentVehiclesData?.vehiclesByIds ?? []) {
    recentVehiclesById[v._id] = v;
  }
  const recentArticlesById: Record<string, Article> = {};
  for (const a of recentArticlesData?.articlesByIds ?? []) {
    recentArticlesById[a._id] = a;
  }

  const navItems: NavItem[] = [
    {
      id: 'liked',
      label: t('nav.liked'),
      count: likedVehicles.length + likedArticles.length,
      icon: <NavIcon path="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    },
    {
      id: 'recent',
      label: t('nav.recentViews'),
      count: recentViews.length,
      icon: <NavIcon path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 5v5l4 2-1 1.73-5-3V7h2z" />,
    },
    {
      id: 'followers',
      label: t('nav.followers'),
      count: followersCount,
      icon: <NavIcon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
    },
    {
      id: 'following',
      label: t('nav.following'),
      count: followingCount,
      icon: <NavIcon path="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
    },
    {
      id: 'my-articles',
      label: t('nav.myArticles'),
      count: myArticles.length,
      icon: <NavIcon path="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,
    },
    {
      id: 'write-article',
      label: t('nav.writeArticle'),
      icon: <NavIcon path="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />,
    },
    {
      id: 'my-vehicles',
      label: t('nav.myVehicles'),
      count: myVehicles.length,
      dealerOnly: true,
      icon: <NavIcon path="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 17l4-4 4 4M17 13v8M9 17H7a2 2 0 01-2-2v-2" />,
    },
    {
      id: 'add-vehicle',
      label: t('nav.addVehicle'),
      dealerOnly: true,
      icon: <NavIcon path="M12 5v14M5 12h14" />,
    },
  ];

  const visibleNav = navItems.filter((n) => !n.dealerOnly || isDealer);

  return (
    <Layout>
      <Container className="py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* ── Left Sidebar ── */}
          <aside className="hidden w-60 shrink-0 lg:block">
            {/* Profile card */}
            <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-col items-center text-center">
                <Avatar name={user.name} size="lg" />
                <h1 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">{user.name}</h1>
                <span className="mt-1 rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {ta(`enums.role.${user.role}`, { defaultValue: user.role })}
                </span>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 truncate w-full">{user.email}</p>
                <div className="mt-3 flex justify-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                  <button onClick={() => setTab('followers')} className="flex flex-col items-center hover:text-zinc-900 dark:hover:text-white">
                    <span className="text-base font-bold text-zinc-900 dark:text-white">{followersCount}</span>
                    <span>{t('followersLabel')}</span>
                  </button>
                  <button onClick={() => setTab('following')} className="flex flex-col items-center hover:text-zinc-900 dark:hover:text-white">
                    <span className="text-base font-bold text-zinc-900 dark:text-white">{followingCount}</span>
                    <span>{t('followingLabel')}</span>
                  </button>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 w-full rounded-xl border border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {t('logout')}
              </button>
            </div>

            {/* Nav */}
            <nav className="rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
              {visibleNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    tab === item.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      tab === item.id
                        ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Mobile Tab Bar (shown < lg) ── */}
          <div className="lg:hidden w-full">
            <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {visibleNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                    tab === item.id
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">{item.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Content ── */}
          <main className="min-w-0 flex-1">
            {/* Mobile profile header */}
            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
              <Avatar name={user.name} size="md" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-bold text-zinc-900 dark:text-white">{user.name}</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{ta(`enums.role.${user.role}`, { defaultValue: user.role })} · {user.email}</p>
              </div>
              <button onClick={logout} className="shrink-0 rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                {t('logout')}
              </button>
            </div>

            {/* Followers */}
            {tab === 'followers' && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {followers.length === 0
                  ? <EmptyState msg={t('empty.noFollowers')} />
                  : followers.map((f) => <UserCard key={f._id} user={f.user} />)}
              </div>
            )}

            {/* Following */}
            {tab === 'following' && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {following.length === 0
                  ? <EmptyState msg={t('empty.notFollowingAnyone')} />
                  : following.map((f) => <UserCard key={f._id} user={f.user} />)}
              </div>
            )}

            {/* Liked */}
            {tab === 'liked' && (
              <div className="space-y-8">
                <section>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {t('sections.likedVehicles', { count: likedVehicles.length })}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {likedVehicles.length === 0
                      ? <EmptyState msg={t('empty.noLikedVehicles')} />
                      : likedVehicles.map((v) => <VehicleCard key={v._id} vehicle={v as Vehicle} />)}
                  </div>
                </section>
                <section>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {t('sections.likedArticles', { count: likedArticles.length })}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {likedArticles.length === 0
                      ? <EmptyState msg={t('empty.noLikedArticles')} />
                      : likedArticles.map((a) => <ArticleCard key={a._id} article={a as Article} />)}
                  </div>
                </section>
              </div>
            )}

            {/* My Articles */}
            {tab === 'my-articles' && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {myArticles.length === 0
                  ? <EmptyState msg={t('empty.noArticlesWritten')} />
                  : myArticles.map((a) => <ArticleCard key={a._id} article={a as Article} />)}
              </div>
            )}

            {/* Write Article */}
            {tab === 'write-article' && (
              <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-white">{t('articleForm.writeNew')}</h2>
                {articleDone ? (
                  <div className="text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('articleForm.publishedSuccess')}</p>
                    <div className="mt-4 flex justify-center gap-3">
                      <button onClick={() => { setArticleDone(false); formKey.current++; }} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                        {t('articleForm.writeAnother')}
                      </button>
                      <button onClick={() => setTab('my-articles')} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                        {t('articleForm.viewMyArticles')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <CreateArticleForm key={formKey.current} onDone={() => setArticleDone(true)} />
                )}
              </div>
            )}

            {/* Recent Views */}
            {tab === 'recent' && (
              <div>
                {recentViews.length === 0 ? (
                  <EmptyState msg={t('empty.noRecentViews')} />
                ) : (
                  <div className="space-y-8">
                    {/* Vehicle recent views as cards */}
                    {vehicleRecentIds.length > 0 && (
                      <section>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          {t('sections.recentVehicles')}
                        </h2>
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                          {recentViews
                            .filter((rv) => rv.targetType === 'VEHICLE')
                            .map((rv) => {
                              const vehicle = recentVehiclesById[rv.targetId];
                              if (!vehicle) return null;
                              return <VehicleCard key={rv._id} vehicle={vehicle} />;
                            })}
                        </div>
                      </section>
                    )}

                    {/* Article recent views as cards */}
                    {articleRecentIds.length > 0 && (
                      <section>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          {t('sections.recentArticles')}
                        </h2>
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                          {recentViews
                            .filter((rv) => rv.targetType === 'ARTICLE')
                            .map((rv) => {
                              const article = recentArticlesById[rv.targetId];
                              if (!article) return null;
                              return <ArticleCard key={rv._id} article={article} />;
                            })}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* My Vehicles (dealer) */}
            {tab === 'my-vehicles' && isDealer && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {myVehicles.length === 0
                  ? <EmptyState msg={t('empty.noVehiclesListed')} />
                  : myVehicles.map((v) => <VehicleCard key={v._id} vehicle={v as Vehicle} />)}
              </div>
            )}

            {/* Add Vehicle (dealer) */}
            {tab === 'add-vehicle' && isDealer && (
              <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-white">{t('vehicleForm.listNew')}</h2>
                {vehicleDone ? (
                  <div className="text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('vehicleForm.listedSuccess')}</p>
                    <div className="mt-4 flex justify-center gap-3">
                      <button onClick={() => { setVehicleDone(false); formKey.current++; }} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                        {t('vehicleForm.addAnother')}
                      </button>
                      <button onClick={() => setTab('my-vehicles')} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                        {t('vehicleForm.viewMyVehicles')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <CreateVehicleForm key={formKey.current} onDone={() => setVehicleDone(true)} />
                )}
              </div>
            )}
          </main>
        </div>
      </Container>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common', 'chat', 'mypage', 'admin', 'products'])),
  },
});
