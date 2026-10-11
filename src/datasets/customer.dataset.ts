import type { SqlDataset } from './dataset.types.js';

const COUNT_CUSTOMER = 1000;

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

export const customerDataset: SqlDataset = {
  name: 'customer',
  description: `customer table (customer_db), ${COUNT_CUSTOMER} rows`,
  build(faker) {
    const seen = new Set<string>();
    const rows: unknown[][] = [];
    while (rows.length < COUNT_CUSTOMER) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const middleName = faker.person.middleName();
      const email = faker.internet.email({
        firstName,
        lastName,
        allowSpecialCharacters: true,
      });
      if (seen.has(email)) continue;
      seen.add(email);
      rows.push([
        `${firstName} ${middleName} ${lastName}`,
        email,
        faker.phone.number({ style: 'international' }),
        faker.date.birthdate().toISOString().slice(0, 10),
        faker.helpers.weightedArrayElement([
          { value: 'ACTIVE', weight: 90 },
          { value: 'INACTIVE', weight: 8 },
          { value: 'BANNED', weight: 2 },
        ]),
      ]);
    }
    return {
      schemaSql: CREATE_TABLE_SQL,
      tables: [
        {
          table: 'customer',
          columns: ['name', 'email', 'phone', 'birthday', 'status'],
          rows,
        },
      ],
    };
  },
};
