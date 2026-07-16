import Link from 'next/link';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Container from '@/components/ui/Container';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'buying', label: 'Buying a Car' },
  { id: 'selling', label: 'Selling a Car' },
  { id: 'account', label: 'Account & Profile' },
  { id: 'search', label: 'Search & Filters' },
  { id: 'safety', label: 'Safety & Trust' },
];

const FAQS: Record<string, { q: string; a: string }[]> = {
  buying: [
    {
      q: 'How do I contact a seller about a vehicle?',
      a: 'Open the vehicle detail page and click the "Contact Dealer" button. You can message the seller directly through our platform. You must be logged in to send messages.',
    },
    {
      q: 'Are the listed prices negotiable?',
      a: 'Most prices are negotiable. We recommend contacting the seller directly to discuss. Our platform does not set or guarantee any pricing — all transactions are between buyer and seller.',
    },
    {
      q: 'Can I test drive a vehicle before buying?',
      a: 'Yes — you can arrange a test drive directly with the seller. Always meet in a safe, public location and bring a valid driving licence.',
    },
    {
      q: 'What should I check before buying a used car?',
      a: 'We recommend checking the vehicle history (VIN report), arranging a pre-purchase inspection by a qualified mechanic, verifying the title is clear, and confirming the seller\'s identity. Read our blog for a full used car checklist.',
    },
    {
      q: 'Does Ucar handle payments or financing?',
      a: 'Currently Ucar is a marketplace platform — payments and financing are arranged directly between buyer and seller. We do not process transactions or offer financing at this time.',
    },
  ],
  selling: [
    {
      q: 'How do I list my car on Ucar?',
      a: 'You need a Dealer account to list vehicles. Sign up and select "Dealer" as your role. Once logged in, go to your dashboard and click "Add Vehicle". Fill in the details, upload photos, and publish.',
    },
    {
      q: 'How many photos should I upload?',
      a: 'We recommend at least 5 photos: front, rear, both sides, and the interior. More photos lead to significantly more enquiries. Use good lighting and a clean background.',
    },
    {
      q: 'How long does a listing stay active?',
      a: 'Listings remain active until you mark the vehicle as sold or delete the listing. There is no expiry date.',
    },
    {
      q: 'Can I edit my listing after publishing?',
      a: 'Yes. Go to your dealer dashboard, find the listing, and click Edit. You can update price, description, photos, and status at any time.',
    },
    {
      q: 'How do I mark a vehicle as sold?',
      a: 'In your dealer dashboard, open the vehicle listing and change its status to "SOLD". The listing will remain visible but clearly marked as sold.',
    },
  ],
  account: [
    {
      q: 'What is the difference between a User and a Dealer account?',
      a: 'User accounts are for buyers — you can browse, save favourites, like listings, and message sellers. Dealer accounts can do everything a User can, plus create and manage vehicle listings.',
    },
    {
      q: 'Can I change my account role after signing up?',
      a: 'Role changes require contacting support. We\'re working on a self-service role upgrade flow — it will be available soon.',
    },
    {
      q: 'How do I update my profile information?',
      a: 'Go to My Page from the navigation bar. Profile editing — including name, avatar, and contact details — will be available in an upcoming update.',
    },
    {
      q: 'I forgot my password. How do I reset it?',
      a: 'Password reset via email is coming soon. In the meantime, please contact support at help@ucar.com and we\'ll assist you manually.',
    },
    {
      q: 'How do I delete my account?',
      a: 'To request account deletion, email support@ucar.com with your registered email address. We will process your request within 5 business days.',
    },
  ],
  search: [
    {
      q: 'How does the AI search work?',
      a: 'Our AI search understands natural language. Instead of selecting individual filters, just describe what you\'re looking for — "comfortable family SUV under $40,000" or "sporty German coupe automatic". The AI extracts the relevant filters and finds matching vehicles instantly.',
    },
    {
      q: 'Can I combine AI search with manual filters?',
      a: 'Yes. You can use the AI search bar for a natural language query, then refine further using the manual filter panel for brand, fuel type, gearbox, and price range.',
    },
    {
      q: 'Why is my search returning no results?',
      a: 'Try broader terms — for example, search "SUV" instead of "7-seat diesel SUV with panoramic roof". You can also clear all filters and browse the full inventory, then narrow down from there.',
    },
    {
      q: 'Can I search for vehicles in a specific city?',
      a: 'Yes — include the city name in your search query, e.g. "Toyota SUV New York". The AI will filter by location when it appears in vehicle listings.',
    },
    {
      q: 'How do I sort search results?',
      a: 'Results are currently sorted by newest listing first. Sorting by price, mileage, and year is on our roadmap and will be available in a future update.',
    },
  ],
  safety: [
    {
      q: 'How does Ucar verify sellers?',
      a: 'All dealers must create an account with a valid email. We are building an identity verification system with document checks — this will be required for all dealer listings in a future update.',
    },
    {
      q: 'What should I do if I suspect a fraudulent listing?',
      a: 'Do not send any money or personal documents to the seller. Report the listing by contacting us at report@ucar.com with the listing URL and a description of your concern. We will investigate within 24 hours.',
    },
    {
      q: 'Is my personal data safe?',
      a: 'We store only what is necessary — your name, email, and role. Passwords are hashed with bcrypt and never stored in plain text. We do not sell your data to third parties.',
    },
    {
      q: 'Tips for a safe transaction',
      a: 'Always meet in a public place, bring someone with you, never pay cash before inspecting the vehicle in person, and use a traceable payment method. Get all agreements in writing.',
    },
  ],
};

const CONTACT_OPTIONS = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Email Support',
    value: 'support@ucar.com',
    desc: 'We reply within 24 hours',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Live Chat',
    value: 'Coming soon',
    desc: 'Real-time chat support',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Blog & Guides',
    value: 'Visit the blog',
    desc: 'Tips, guides & car advice',
    href: '/blog',
  },
];

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
  const [activeCategory, setActiveCategory] = useState('buying');

  return (
    <Layout>
      {/* Hero */}
      <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <Container className="py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            How can we help?
          </h1>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
            Browse frequently asked questions or get in touch with our team.
          </p>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Sidebar — category tabs */}
          <aside className="lg:col-span-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Topics
            </p>
            <nav className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    activeCategory === cat.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* FAQ list */}
          <main className="lg:col-span-3">
            <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-white">
              {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </h2>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {FAQS[activeCategory]?.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </main>
        </div>

        {/* Contact options */}
        <div className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
          <h2 className="mb-2 text-center text-xl font-semibold text-zinc-900 dark:text-white">
            Still need help?
          </h2>
          <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Our team is here for you.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {CONTACT_OPTIONS.map((opt) => (
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
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick links</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/products', label: 'Browse vehicles' },
              { href: '/blog', label: 'Read the blog' },
              { href: '/signup', label: 'Create an account' },
              { href: '/login', label: 'Sign in' },
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
