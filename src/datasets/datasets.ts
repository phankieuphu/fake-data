import { createFaker } from '../common/faker.factory.js';
import { customerDataset } from './customer.dataset.js';
import { renderSqlScript, type SqlDataset } from './dataset.types.js';
import { vehicleDataset } from './vehicle.dataset.js';

export const DATASETS: SqlDataset[] = [customerDataset, vehicleDataset];

export function findDataset(name: string): SqlDataset | undefined {
  return DATASETS.find((dataset) => dataset.name === name);
}

/** Renders a dataset's full SQL seed script. Deterministic per seed. */
export function renderDataset(dataset: SqlDataset, seed: string): string {
  const { schemaSql, tables } = dataset.build(
    createFaker(`${seed}:dataset:${dataset.name}`),
  );
  return renderSqlScript(schemaSql, tables);
}
