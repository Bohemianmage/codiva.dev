import { DEFAULT_LOCALE, type Locale } from './config';
import { DICTIONARIES, type Dict } from './dictionaries';

export type TranslateOptions = {
  returnObjects?: boolean;
  defaultValue?: string;
  [key: string]: unknown;
};

function lookup(dict: Dict, key: string): unknown {
  const parts = key.split('.');
  let cur: unknown = dict;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur) || !(part in cur)) {
      return undefined;
    }
    cur = (cur as Dict)[part];
  }
  return cur;
}

function interpolate(value: string, vars?: Record<string, unknown>): string {
  if (!vars) return value;
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    const v = vars[name];
    return v == null ? '' : String(v);
  });
}

export { resolveLocale } from './config';

export function tSync(locale: Locale, key: string, options?: TranslateOptions): string {
  const found = lookup(DICTIONARIES[locale], key);
  if (typeof found === 'string') return interpolate(found, options);
  const fallback = lookup(DICTIONARIES[DEFAULT_LOCALE], key);
  if (typeof fallback === 'string') return interpolate(fallback, options);
  if (typeof options?.defaultValue === 'string') return interpolate(options.defaultValue, options);
  return key;
}

export function tObject<T = unknown>(locale: Locale, key: string): T | undefined {
  const found = lookup(DICTIONARIES[locale], key);
  if (found !== undefined) return found as T;
  return lookup(DICTIONARIES[DEFAULT_LOCALE], key) as T | undefined;
}

export function createT(locale: Locale) {
  function t(key: string, options?: TranslateOptions): string {
    if (options?.returnObjects) {
      const obj = tObject(locale, key);
      return (obj as string) ?? key;
    }
    return tSync(locale, key, options);
  }
  t.locale = locale;
  t.raw = <T = unknown>(key: string) => tObject<T>(locale, key);
  return t;
}

export type Translator = ReturnType<typeof createT>;
