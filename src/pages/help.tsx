import Link from 'next/link';
import type { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORY_IDS = ['buying', 'selling', 'account', 'search', 'safety'] as const;

interface FaqEntry {
  q: string;
  a: string;
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-zinc-900 dark:text-white">{q}</span>
        <span className={`mt-0.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{a}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const { t } = useTranslation('help');
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_IDS)[number]>('buying');

  const faqs = t(`faqs.${activeCategory}`, { returnObjects: true }) as unknown as FaqEntry[];

  const contactOptions = [
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: t('contact.emailSupport'),
      value: 'support@ucar.com',
      desc: t('contact.emailReply'),
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: t('contact.liveChat'),
      value: t('contact.comingSoon'),
      desc: t('contact.liveChatDesc'),
    },
    {
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: t('contact.blogGuides'),
      value: t('contact.visitBlog'),
      desc: t('contact.blogDesc'),
      href: '/blog',
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <Container className="py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {t('hero.title')}
          </h1>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
            {t('hero.subtitle')}
          </p>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Sidebar — category tabs */}
          <aside className="lg:col-span-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t('topics')}
            </p>
            <nav className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1">
              {CATEGORY_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveCategory(id)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    activeCategory === id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {t(`categories.${id}`)}
                </button>
              ))}
            </nav>
          </aside>

          {/* FAQ list */}
          <main className="lg:col-span-3">
            <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-white">
              {t(`categories.${activeCategory}`)}
            </h2>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {faqs?.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </main>
        </div>

        {/* Contact options */}
        <div className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
          <h2 className="mb-2 text-center text-xl font-semibold text-zinc-900 dark:text-white">
            {t('stillNeedHelp')}
          </h2>
          <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t('teamHere')}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {contactOptions.map((opt) => (
              <div
                key={opt.label}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {opt.icon}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{opt.label}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{opt.desc}</p>
                {opt.href ? (
                  <Link
                    href={opt.href}
                    className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-white"
                  >
                    {opt.value} →
                  </Link>
                ) : (
                  <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-white">
                    {opt.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-12 rounded-2xl bg-zinc-50 p-8 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t('quickLinks')}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/products', label: t('links.browseVehicles') },
              { href: '/blog', label: t('links.readBlog') },
              { href: '/signup', label: t('links.createAccount') },
              { href: '/login', label: t('links.signIn') },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-white dark:hover:text-white"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'en', ['common', 'chat', 'help'])) },
});
