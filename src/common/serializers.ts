type Row = Record<string, unknown>;

function columnsOf(rows: Row[]): string[] {
  const columns = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
  return [...columns];
}

/** Nested objects / arrays are stored as JSON text. */
function flatten(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return value as string | number | boolean;
}

function csvCell(value: unknown): string {
  const flat = flatten(value);
  if (flat === null) return '';
  const text = String(flat);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Row[]): string {
  const columns = columnsOf(rows);
  const lines = [columns.join(',')];
  for (const row of rows)
    lines.push(columns.map((column) => csvCell(row[column])).join(','));
  return lines.join('\n') + '\n';
}

export function sqlLiteral(value: unknown): string {
  const flat = flatten(value);
  if (flat === null) return 'NULL';
  if (typeof flat === 'number') return String(flat);
  if (typeof flat === 'boolean') return flat ? 'TRUE' : 'FALSE';
  return `'${flat.replace(/'/g, "''")}'`;
}

export const toSnakeCase = (name: string): string =>
  name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/-/g, '_');

export function buildInsertStatement(
  table: string,
  columns: string[],
  rows: unknown[][],
): string {
  if (rows.length === 0) return '';
  const values = rows
    .map((row) => `(${row.map(sqlLiteral).join(', ')})`)
    .join(',\n  ');
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n  ${values};\n`;
}

/** Postgres-flavoured INSERTs; column names converted to snake_case. */
export function toSql(table: string, rows: Row[], batchSize = 500): string {
  const columns = columnsOf(rows);
  const sqlTable = toSnakeCase(table);
  const sqlColumns = columns.map(toSnakeCase);
  let sql = '';
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows
      .slice(i, i + batchSize)
      .map((row) => columns.map((column) => row[column]));
    sql += buildInsertStatement(sqlTable, sqlColumns, chunk);
  }
  return sql;
}
