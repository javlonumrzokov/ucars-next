import { useRouter } from 'next/router';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: '한국어' },
  { code: 'ru', label: 'RU' },
] as const;

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const router = useRouter();

  function switchTo(code: string) {
    router.push({ pathname: router.pathname, query: router.query }, router.asPath, {
      locale: code,
    });
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          className={
            router.locale === code
              ? 'rounded-md px-2 py-1 font-semibold text-zinc-900 dark:text-white'
              : 'rounded-md px-2 py-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
