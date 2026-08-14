import type { Locale } from './config';
import enCareer from './locales/en/career.json';
import enCore from './locales/en/core.json';
import enOps from './locales/en/ops.json';
import enServer from './locales/en/server.json';
import enTicket from './locales/en/ticket.json';
import esCareer from './locales/es/career.json';
import esCore from './locales/es/core.json';
import esOps from './locales/es/ops.json';
import esServer from './locales/es/server.json';
import esTicket from './locales/es/ticket.json';

export type Dict = Record<string, unknown>;

function merge(...parts: Dict[]): Dict {
  return Object.assign({}, ...parts);
}

/** Full dictionaries for server-side tSync / getT. Client i18n loads core only. */
export const DICTIONARIES: Record<Locale, Dict> = {
  es: merge(esCore, esTicket, esCareer, esOps, esServer),
  en: merge(enCore, enTicket, enCareer, enOps, enServer),
};
