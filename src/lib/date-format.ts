const BCP47_MAP: Record<string, string> = { en: 'en-US', ko: 'ko-KR', ru: 'ru-RU' };

export function toBcp47(locale?: string): string {
  return BCP47_MAP[locale ?? 'en'] ?? 'en-US';
}

export function formatDate(
  iso: string | Date,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString(toBcp47(locale), options);
}

export function formatTime(
  iso: string | Date,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleTimeString(toBcp47(locale), options);
}
