/**
 * Offline SQL seed generator (the original `node main.js` workflow).
 *
 *   npm run generate:sql                 # all datasets
 *   npm run generate:sql -- customer     # one dataset
 *   npm run generate:sql -- vehicle 42   # with a custom seed
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SEED } from '../common/faker.factory.js';
import { DATASETS, findDataset, renderDataset } from '../datasets/datasets.js';

const OUTPUT_DIR = join(process.cwd(), 'data');

function main(): void {
  const [target = 'all', seed = String(DEFAULT_SEED)] = process.argv.slice(2);
  const datasets = target === 'all' ? DATASETS : [findDataset(target)];

  if (datasets.some((dataset) => !dataset)) {
    console.error(`Unknown dataset: ${target}`);
    console.error(
      `Usage: npm run generate:sql -- [${DATASETS.map((d) => d.name).join('|')}|all] [seed]`,
    );
    process.exitCode = 1;
    return;
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const dataset of datasets) {
    const file = join(OUTPUT_DIR, `${dataset!.name}.sql`);
    writeFileSync(file, renderDataset(dataset!, seed));
    console.log(`Wrote ${file}`);
  }
}

main();
