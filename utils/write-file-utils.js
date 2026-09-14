const fs = require("fs");
const { buildInsertStatement } = require("./sql-utils");

const DEFAULT_BATCH_SIZE = 1000;

// inserts: array of { table, columns, rows }
function writeSqlFile(outputFile, createTableSql, inserts, batchSize = DEFAULT_BATCH_SIZE) {
  const sqlStream = fs.createWriteStream(outputFile, { flags: "w" });

  sqlStream.write(createTableSql + "\n");
  for (const { table, columns, rows } of inserts) {
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      sqlStream.write(buildInsertStatement(table, columns, chunk));
    }
  }
  sqlStream.end();

  return outputFile;
}

module.exports = { writeSqlFile };
