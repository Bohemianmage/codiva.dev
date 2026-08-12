import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from './config';
import { createT, type Translator } from './translate';

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get('accept-language');
  return localeFromAcceptLanguage(accept);
}

export async function getT(): Promise<Translator> {
  return createT(await getLocale());
}

export { DEFAULT_LOCALE, type Locale, type Translator };
