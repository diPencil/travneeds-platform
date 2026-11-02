import { cookies } from 'next/headers';
import { ALL_LOCALES, DEFAULT_LOCALE, sanitizeLocale, type Locale } from '@/lib/locale-config';

/**
 * Server-side locale detection from cookies.
 * Falls back to DEFAULT_LOCALE ('en') if no valid cookie.
 * Used for server-rendered HTML lang attribute and metadata.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('star-locale')?.value;
  return sanitizeLocale(localeCookie);
}

/**
 * Get the HTML lang attribute value for the current locale.
 * Maps locale codes to BCP 47 language tags.
 */
export function getHtmlLang(locale: Locale): string {
  const langMap: Record<Locale, string> = {
    en: 'en',
    es: 'es',
    it: 'it',
    ar: 'ar',
  };
  return langMap[locale] ?? 'en';
}

/**
 * Get the Open Graph locale for the current locale.
 */
export function getOgLocale(locale: Locale): string {
  const ogMap: Record<Locale, string> = {
    en: 'en_US',
    es: 'es_ES',
    it: 'it_IT',
    ar: 'ar_EG',
  };
  return ogMap[locale] ?? 'en_US';
}