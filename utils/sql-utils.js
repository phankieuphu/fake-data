function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildInsertStatement(table, columns, rows) {
  if (rows.length === 0) return "";
  const valuesSql = rows
    .map((row) => `(${row.map(sqlLiteral).join(", ")})`)
    .join(",\n  ");
  return `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n  ${valuesSql};\n`;
}

async function insertBatch(client, table, columns, rows, sqlStream) {
  if (rows.length === 0) return;
  const values = [];
  const placeholders = rows
    .map((row, i) => {
      const base = i * columns.length;
      values.push(...row);
      return `(${columns.map((_, j) => `$${base + j + 1}`).join(", ")})`;
    })
    .join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}`;
  await client.query(sql, values);
  if (sqlStream) sqlStream.write(buildInsertStatement(table, columns, rows));
}

module.exports = { sqlLiteral, buildInsertStatement, insertBatch };
