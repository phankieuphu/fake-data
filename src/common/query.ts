import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_LOCALE,
  DEFAULT_SEED,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from './faker.factory.js';

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 10;
export const MAX_EXPORT = 5000;

export const OUTPUT_FORMATS = ['json', 'csv', 'sql'] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export interface GenerateOptions {
  seed: string;
  locale: string;
  page: number;
  limit: number;
  fields?: string[];
  format: OutputFormat;
}

export type RawQuery = Record<string, unknown>;

function str(value: unknown): string | undefined {
  if (Array.isArray(value)) value = value[0];
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined;
}

export function parseIntParam(
  raw: unknown,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = str(raw);
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequestException(
      `"${name}" must be an integer between ${min} and ${max}`,
    );
  }
  return parsed;
}

export function parseOptions(
  query: RawQuery,
  maxLimit = MAX_LIMIT,
): GenerateOptions {
  const locale = str(query.locale) ?? DEFAULT_LOCALE;
  if (!isSupportedLocale(locale)) {
    throw new BadRequestException(
      `Unsupported locale "${locale}". Supported: ${SUPPORTED_LOCALES.join(', ')}`,
    );
  }

  const format = (str(query.format) ?? 'json') as OutputFormat;
  if (!OUTPUT_FORMATS.includes(format)) {
    throw new BadRequestException(
      `"format" must be one of: ${OUTPUT_FORMATS.join(', ')}`,
    );
  }

  const fields = str(query.fields)
    ?.split(',')
    .map((field) => field.trim())
    .filter(Boolean);

  return {
    seed: str(query.seed) ?? String(DEFAULT_SEED),
    locale,
    page: parseIntParam(query.page, 'page', 1, 1, 1_000_000),
    limit: parseIntParam(query.limit, 'limit', DEFAULT_LIMIT, 1, maxLimit),
    fields,
    format,
  };
}
