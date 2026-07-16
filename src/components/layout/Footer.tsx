import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
                U
              </span>
              <span className="text-lg font-semibold">Ucar</span>
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Buy and sell new and used cars.
            </p>
          </div>
          <FooterCol title="Explore" links={[
            { href: '/products', label: 'Products' },
            { href: '/blog', label: 'Blog' },
            { href: '/help', label: 'Help' },
          ]} />
          <FooterCol title="Account" links={[
            { href: '/login', label: 'Login' },
            { href: '/signup', label: 'Sign up' },
            { href: '/mypage', label: 'My Page' },
          ]} />
          <FooterCol title="Company" links={[
            { href: '#', label: 'About' },
            { href: '#', label: 'Contact' },
            { href: '#', label: 'Terms' },
          ]} />
        </div>
        <div className="mt-10 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          © {new Date().getFullYear()} Ucar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
