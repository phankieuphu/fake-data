import type { Faker } from '@faker-js/faker';
import { buildInsertStatement } from '../common/serializers.js';

export interface TableData {
  table: string;
  columns: string[];
  rows: unknown[][];
}

/** A full Postgres seed script: schema DDL plus related tables of INSERTs. */
export interface SqlDataset {
  name: string;
  description: string;
  build(faker: Faker): { schemaSql: string; tables: TableData[] };
}

export function renderSqlScript(
  schemaSql: string,
  tables: TableData[],
  batchSize = 1000,
): string {
  let sql = schemaSql + '\n';
  for (const { table, columns, rows } of tables) {
    for (let i = 0; i < rows.length; i += batchSize) {
      sql += buildInsertStatement(table, columns, rows.slice(i, i + batchSize));
    }
  }
  return sql;
}
