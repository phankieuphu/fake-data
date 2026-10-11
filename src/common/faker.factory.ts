import { Faker, allLocales, type LocaleDefinition } from '@faker-js/faker';

export const DEFAULT_LOCALE = 'en';
export const DEFAULT_SEED = 1;

// All relative dates (past/future/recent...) are computed from this fixed
// reference date, so the same id + seed always produces the same entity.
export const REFERENCE_DATE = new Date('2026-01-01T00:00:00.000Z');

export const SUPPORTED_LOCALES = Object.keys(allLocales).filter(
  (locale) => locale !== 'base',
);

export function isSupportedLocale(locale: string): boolean {
  return SUPPORTED_LOCALES.includes(locale);
}

const localeChains = new Map<string, LocaleDefinition[]>();

function localeChain(locale: string): LocaleDefinition[] {
  let chain = localeChains.get(locale);
  if (!chain) {
    const locales = allLocales as Record<string, LocaleDefinition>;
    chain = [locales[locale], locales.en, locales.base].filter(Boolean);
    localeChains.set(locale, chain);
  }
  return chain;
}

// FNV-1a: stable 32-bit hash so string keys map to faker seeds.
export function hashSeed(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Returns a fresh Faker instance seeded from `key`. A new instance per entity
 * keeps generation isolated: generating a related entity mid-way never shifts
 * the random sequence of the entity being built.
 */
export function createFaker(key: string, locale = DEFAULT_LOCALE): Faker {
  const faker = new Faker({ locale: localeChain(locale) });
  faker.seed(hashSeed(key));
  faker.setDefaultRefDate(REFERENCE_DATE);
  return faker;
}
