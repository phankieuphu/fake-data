const path = require("path");
const { faker } = require("@faker-js/faker");
const { writeSqlFile } = require("../utils/write-file-utils");

const COUNT_CUSTOMER = 1000;
const SQL_OUTPUT_FILE = path.join(__dirname, "..", "data", "customer.sql");

const STATUSES = ["ACTIVE", "INACTIVE", "BANNED"];
const STATUS_WEIGHTS = [0.9, 0.08, 0.02];

const CREATE_TABLE_SQL = `CREATE TABLE customer (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       varchar(255) NOT NULL,
    email      varchar(255) NOT NULL UNIQUE,
    phone      varchar(30),
    birthday   date,
    status     varchar(20) NOT NULL DEFAULT 'ACTIVE'
               CHECK (status IN ('ACTIVE','INACTIVE','BANNED')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
`;

function pickStatus() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < STATUSES.length; i++) {
    acc += STATUS_WEIGHTS[i];
    if (r <= acc) return STATUSES[i];
  }
  return STATUSES[STATUSES.length - 1];
}

function CreateCustomer() {
  const seen = new Set();
  const models = [];
  while (models.length < COUNT_CUSTOMER) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const middleName = faker.person.middleName();
    const name = firstName + " " + middleName + " " + lastName;
    const birthDay = faker.date.birthdate();
    const email = faker.internet.email({
      firstName,
      lastName,
      allowSpecialCharacters: true,
    });
    const phone = faker.phone.number({
      style: "international",
    });
    const status = pickStatus();

    if (seen.has(email)) continue;
    seen.add(email);
    models.push([name, email, phone, birthDay.toISOString().slice(0, 10), status]);
  }
  return models;
}

function generate(outputFile = SQL_OUTPUT_FILE) {
  const customers = CreateCustomer();

  writeSqlFile(outputFile, CREATE_TABLE_SQL, [
    { table: "customer", columns: ["name", "email", "phone", "birthday", "status"], rows: customers },
  ]);

  console.log(`Wrote ${customers.length} customer rows to ${outputFile}`);
  return outputFile;
}

module.exports = { CreateCustomer, generate };
