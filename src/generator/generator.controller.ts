import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  OUTPUT_FORMATS,
  parseIntParam,
  parseOptions,
  type RawQuery,
} from '../common/query.js';
import { toCsv, toSql } from '../common/serializers.js';
import {
  GeneratorService,
  MAX_GENERATE,
  type Schema,
} from './generator.service.js';

const OPTION_KEYS = [
  'count',
  'seed',
  'locale',
  'format',
  'page',
  'limit',
  'fields',
  'table',
];

@ApiTags('custom generator')
@Controller('api/generate')
export class GeneratorController {
  constructor(private readonly generator: GeneratorService) {}

  @Get('methods')
  @ApiOperation({
    summary: 'All "module.method" generators usable in a custom schema',
  })
  methods() {
    return this.generator.methods();
  }

  @Get()
  @ApiOperation({
    summary:
      'Generate rows from query params: each extra param is field=module.method',
    description:
      'Example: /api/generate?count=5&name=person.fullName&email=internet.email&city=location.city',
  })
  @ApiQuery({
    name: 'count',
    required: false,
    type: Number,
    description: `Default 10, max ${MAX_GENERATE}`,
  })
  @ApiQuery({ name: 'seed', required: false })
  @ApiQuery({ name: 'locale', required: false })
  @ApiQuery({ name: 'format', required: false, enum: OUTPUT_FORMATS })
  @ApiQuery({
    name: 'name',
    required: false,
    example: 'person.fullName',
    description: 'Any field name works',
  })
  @ApiQuery({ name: 'email', required: false, example: 'internet.email' })
  fromQuery(
    @Query() query: RawQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const schema: Schema = {};
    for (const [key, value] of Object.entries(query)) {
      if (!OPTION_KEYS.includes(key) && typeof value === 'string')
        schema[key] = value;
    }
    return this.run(schema, query, res);
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Generate rows from a JSON schema (supports nested objects)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        count: 3,
        seed: 42,
        locale: 'en',
        schema: {
          name: 'person.fullName',
          email: 'internet.email',
          address: { city: 'location.city', country: 'location.country' },
          joinedAt: 'date.past',
        },
      },
    },
  })
  fromBody(
    @Body() body: { schema?: Schema } & RawQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { schema, ...options } = body ?? {};
    return this.run(schema as Schema, normalize(options), res);
  }

  private run(schema: Schema, query: RawQuery, res: Response) {
    const count = parseIntParam(query.count, 'count', 10, 1, MAX_GENERATE);
    const opts = parseOptions(query);
    const rows = this.generator.generate(schema, count, opts);
    if (opts.format === 'csv') {
      res.type('text/csv');
      return toCsv(rows);
    }
    if (opts.format === 'sql') {
      res.type('application/sql');
      return toSql(
        typeof query.table === 'string' ? query.table : 'generated',
        rows,
      );
    }
    return rows;
  }
}

/** JSON bodies carry numbers; the query parsers expect strings. */
function normalize(options: RawQuery): RawQuery {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key,
      typeof value === 'number' ? String(value) : value,
    ]),
  );
}
