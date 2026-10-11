import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DEFAULT_SEED } from '../common/faker.factory.js';
import { DATASETS, findDataset, renderDataset } from './datasets.js';

@ApiTags('sql datasets')
@Controller('api/datasets')
export class DatasetsController {
  @Get()
  @ApiOperation({
    summary: 'Ready-to-run Postgres seed scripts (schema + INSERTs)',
  })
  list() {
    return DATASETS.map(({ name, description }) => ({
      name,
      description,
      endpoint: `/api/datasets/${name}.sql`,
    }));
  }

  @Get(':name')
  @ApiOperation({
    summary:
      'Download a dataset as a .sql file, e.g. /api/datasets/customer.sql',
  })
  @ApiParam({ name: 'name', enum: DATASETS.map((d) => `${d.name}.sql`) })
  @ApiQuery({ name: 'seed', required: false })
  download(
    @Param('name') name: string,
    @Query('seed') seed: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const dataset = findDataset(name.replace(/\.sql$/, ''));
    if (!dataset) throw new NotFoundException(`Unknown dataset "${name}"`);
    res.type('application/sql');
    res.attachment(`${dataset.name}.sql`);
    return renderDataset(dataset, seed || String(DEFAULT_SEED));
  }
}
