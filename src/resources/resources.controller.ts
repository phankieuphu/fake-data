import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { SUPPORTED_LOCALES } from '../common/faker.factory.js';
import {
  MAX_EXPORT,
  OUTPUT_FORMATS,
  parseIntParam,
  parseOptions,
  type OutputFormat,
  type RawQuery,
} from '../common/query.js';
import { toCsv, toSql } from '../common/serializers.js';
import { RESOURCE_DEFINITIONS } from './definitions/index.js';
import { ResourceRegistry } from './resource.registry.js';
import type { Entity } from './resource.types.js';
import { ResourcesService } from './resources.service.js';

const RESOURCE_NAMES = RESOURCE_DEFINITIONS.map((def) => def.name);

const ResourceParam = () =>
  ApiParam({
    name: 'resource',
    enum: RESOURCE_NAMES,
    description: 'Resource name, see GET /api/resources',
  });

function CommonQueries(): MethodDecorator {
  const decorators = [
    ApiQuery({
      name: 'seed',
      required: false,
      description:
        'Change to get a different (but still stable) dataset. Default 1',
    }),
    ApiQuery({
      name: 'locale',
      required: false,
      description: 'Faker locale, e.g. en, de, fr, ja, vi, pt_BR. Default en',
    }),
    ApiQuery({
      name: 'fields',
      required: false,
      description: 'Comma-separated fields to return, e.g. id,title,price',
    }),
  ];
  return (target, key, descriptor) => {
    for (const decorate of decorators) decorate(target, key, descriptor);
  };
}

function ListQueries(): MethodDecorator {
  const decorators = [
    CommonQueries(),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Default 1',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Default 10, max 100',
    }),
    ApiQuery({
      name: 'format',
      required: false,
      enum: OUTPUT_FORMATS,
      description: 'json (default), csv or sql',
    }),
  ];
  return (target, key, descriptor) => {
    for (const decorate of decorators) decorate(target, key, descriptor);
  };
}

function render(
  res: Response,
  format: OutputFormat,
  resource: string,
  payload: unknown,
  rows: Entity[],
) {
  if (format === 'csv') {
    res.type('text/csv');
    return toCsv(rows);
  }
  if (format === 'sql') {
    res.type('application/sql');
    return toSql(resource, rows);
  }
  return payload;
}

@ApiTags('resources')
@Controller('api')
export class ResourcesController {
  constructor(
    private readonly service: ResourcesService,
    private readonly registry: ResourceRegistry,
  ) {}

  @Get('resources')
  @ApiOperation({ summary: 'List every available resource, grouped by topic' })
  catalog() {
    const resources = this.registry.catalog();
    const topics = [...new Set(resources.map((r) => r.topic))].map((topic) => ({
      topic,
      resources: resources.filter((r) => r.topic === topic),
    }));
    return { count: resources.length, topics };
  }

  @Get('locales')
  @ApiOperation({
    summary: 'List supported locales for the `locale` query parameter',
  })
  locales() {
    return SUPPORTED_LOCALES;
  }

  @Get(':resource')
  @ApiOperation({ summary: 'Paginated list of a resource' })
  @ResourceParam()
  @ListQueries()
  list(
    @Param('resource') resource: string,
    @Query() query: RawQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const opts = parseOptions(query);
    const page = this.service.list(resource, opts);
    return render(res, opts.format, resource, page, page.data);
  }

  @Get(':resource/random')
  @ApiOperation({ summary: 'Random entities (different on every call)' })
  @ResourceParam()
  @CommonQueries()
  @ApiQuery({
    name: 'count',
    required: false,
    type: Number,
    description: 'Default 1, max 100',
  })
  random(@Param('resource') resource: string, @Query() query: RawQuery) {
    const count = parseIntParam(query.count, 'count', 1, 1, 100);
    const items = this.service.random(resource, count, parseOptions(query));
    return count === 1 && query.count === undefined ? items[0] : items;
  }

  @Get(':resource/export')
  @ApiOperation({
    summary: `Bulk export the first N entities (max ${MAX_EXPORT}) as JSON, CSV or SQL`,
  })
  @ResourceParam()
  @CommonQueries()
  @ApiQuery({
    name: 'count',
    required: false,
    type: Number,
    description: `Default 100, max ${MAX_EXPORT}`,
  })
  @ApiQuery({ name: 'format', required: false, enum: OUTPUT_FORMATS })
  export(
    @Param('resource') resource: string,
    @Query() query: RawQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const count = parseIntParam(query.count, 'count', 100, 1, MAX_EXPORT);
    const opts = { ...parseOptions(query), page: 1, limit: count };
    const { data } = this.service.list(resource, opts);
    res.attachment(`${resource}.${opts.format}`);
    return render(res, opts.format, resource, data, data);
  }

  @Get(':resource/:id')
  @ApiOperation({
    summary: 'Single entity by id (stable for a given seed + locale)',
  })
  @ResourceParam()
  @CommonQueries()
  get(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RawQuery,
  ) {
    return this.service.get(resource, id, parseOptions(query));
  }

  @Get(':resource/:id/:child')
  @ApiOperation({
    summary:
      'Nested resources, e.g. /api/users/1/posts or /api/posts/1/comments',
  })
  @ResourceParam()
  @ApiParam({ name: 'child', enum: RESOURCE_NAMES })
  @ListQueries()
  children(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('child') child: string,
    @Query() query: RawQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const opts = parseOptions(query);
    const page = this.service.listChildren(resource, id, child, opts);
    return render(res, opts.format, child, page, page.data);
  }

  @Post(':resource')
  @ApiOperation({
    summary:
      'Simulated create — echoes the body with a new id (nothing is stored)',
  })
  @ResourceParam()
  @ApiBody({
    schema: { type: 'object', example: { title: 'Hello world', userId: 1 } },
  })
  create(
    @Param('resource') resource: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.create(resource, body ?? {});
  }

  @Put(':resource/:id')
  @ApiOperation({ summary: 'Simulated replace (nothing is stored)' })
  @ResourceParam()
  @ApiBody({ schema: { type: 'object', example: { title: 'Replaced' } } })
  replace(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Query() query: RawQuery,
  ) {
    return this.service.replace(resource, id, body ?? {}, parseOptions(query));
  }

  @Patch(':resource/:id')
  @ApiOperation({
    summary:
      'Simulated partial update — returns the entity merged with the body',
  })
  @ResourceParam()
  @ApiBody({ schema: { type: 'object', example: { title: 'Updated title' } } })
  update(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Query() query: RawQuery,
  ) {
    return this.service.update(resource, id, body ?? {}, parseOptions(query));
  }

  @Delete(':resource/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Simulated delete (nothing is stored)' })
  @ResourceParam()
  remove(
    @Param('resource') resource: string,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RawQuery,
  ) {
    return this.service.remove(resource, id, parseOptions(query));
  }
}
