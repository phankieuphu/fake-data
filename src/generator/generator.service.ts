import { BadRequestException, Injectable } from '@nestjs/common';
import type { Faker } from '@faker-js/faker';
import { createFaker } from '../common/faker.factory.js';
import type { GenerateOptions } from '../common/query.js';

export const MAX_GENERATE = 1000;

/** Faker modules callable from custom schemas (helpers is excluded: it needs arguments). */
export const ALLOWED_MODULES = [
  'airline',
  'animal',
  'book',
  'color',
  'commerce',
  'company',
  'database',
  'datatype',
  'date',
  'finance',
  'food',
  'git',
  'hacker',
  'image',
  'internet',
  'location',
  'lorem',
  'music',
  'number',
  'person',
  'phone',
  'science',
  'string',
  'system',
  'vehicle',
  'word',
] as const;

/** A field spec is "module.method" or a nested object of field specs. */
export type Schema = { [field: string]: string | Schema };

@Injectable()
export class GeneratorService {
  /** Lists every callable "module.method" path, for discovery. */
  methods(): Record<string, string[]> {
    const faker = createFaker('methods') as unknown as Record<
      string,
      Record<string, unknown>
    >;
    return Object.fromEntries(
      ALLOWED_MODULES.map((module) => [
        module,
        Object.keys(faker[module])
          .filter(
            (method) =>
              !method.startsWith('_') &&
              typeof faker[module][method] === 'function',
          )
          .sort(),
      ]),
    );
  }

  generate(
    schema: Schema,
    count: number,
    opts: GenerateOptions,
  ): Record<string, unknown>[] {
    validate(schema);
    const offset = (opts.page - 1) * count;
    return Array.from({ length: count }, (_, i) => {
      const id = offset + i + 1;
      const faker = createFaker(
        `${opts.seed}:custom:${JSON.stringify(schema)}:${id}`,
        opts.locale,
      );
      return { id, ...build(faker, schema) };
    });
  }
}

function resolve(faker: Faker, path: string): () => unknown {
  const [module, method, ...rest] = path.split('.');
  const target = (faker as unknown as Record<string, Record<string, unknown>>)[
    module
  ];
  const fn = target?.[method];
  if (
    rest.length ||
    !(ALLOWED_MODULES as readonly string[]).includes(module) ||
    method.startsWith('_') ||
    typeof fn !== 'function'
  ) {
    throw new BadRequestException(
      `Unknown generator "${path}". Use "module.method", e.g. person.fullName — see GET /api/generate/methods`,
    );
  }
  return fn as () => unknown;
}

function validate(schema: unknown, depth = 0): asserts schema is Schema {
  if (depth > 5)
    throw new BadRequestException('Schema nesting is limited to 5 levels');
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new BadRequestException(
      'Schema must be an object of { field: "module.method" }',
    );
  }
  const entries = Object.entries(schema);
  if (entries.length === 0 || entries.length > 50) {
    throw new BadRequestException('Schema must have between 1 and 50 fields');
  }
  const probe = createFaker('validate');
  for (const [, spec] of entries) {
    if (typeof spec === 'string') resolve(probe, spec);
    else validate(spec, depth + 1);
  }
}

function build(faker: Faker, schema: Schema): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [field, spec] of Object.entries(schema)) {
    if (typeof spec !== 'string') {
      result[field] = build(faker, spec);
      continue;
    }
    try {
      result[field] = resolve(faker, spec)();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `"${spec}" cannot be called without arguments`,
      );
    }
  }
  return result;
}
