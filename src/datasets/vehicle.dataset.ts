import type { Faker } from '@faker-js/faker';
import type { SqlDataset } from './dataset.types.js';

const MODEL_COUNT = 200;
const VEHICLE_COUNT = 5000;
// customer_id / material_id cross into customer-service / dealership-service
// (no FK) — these ranges just need to look like plausible ids from those
// services. The customer dataset generates 1000 customers.
const CUSTOMER_ID_RANGE = 1000;
const MATERIAL_ID_RANGE = 300;

const CREATE_TABLE_SQL = `\\connect vehicle_db

CREATE TABLE vehicle_model (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    make       varchar(100) NOT NULL,
    model      varchar(100) NOT NULL,
    year       smallint CHECK (year BETWEEN 1900 AND 2100),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (make, model, year)
);

CREATE TABLE vehicle (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vin               varchar(17) NOT NULL UNIQUE,
    license_plate     varchar(20),
    vehicle_model_id  BIGINT NOT NULL REFERENCES vehicle_model(id) ON DELETE RESTRICT,
    warranty_end_date date,
    status            varchar(20) NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'SOLD','SCRAPPED')),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_model ON vehicle(vehicle_model_id);

CREATE TABLE customer_vehicle (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    vehicle_id  BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE RESTRICT,
    owned_from  date NOT NULL DEFAULT CURRENT_DATE,
    owned_to    date,
    status      varchar(20) NOT NULL DEFAULT 'CURRENT'
                CHECK (status IN ('CURRENT','TRANSFERRED')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    CHECK (owned_to IS NULL OR owned_to >= owned_from)
);

CREATE INDEX idx_cust_vehicle_customer ON customer_vehicle(customer_id);
CREATE INDEX idx_cust_vehicle_vehicle  ON customer_vehicle(vehicle_id);

CREATE UNIQUE INDEX uq_vehicle_current_owner
    ON customer_vehicle(vehicle_id) WHERE status = 'CURRENT';

CREATE TABLE vehicle_material (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vehicle_id   BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    material_id  BIGINT NOT NULL,
    count        int NOT NULL CHECK (count > 0),
    description  varchar(255),
    installed_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (vehicle_id, material_id)
);

CREATE INDEX idx_veh_material_vehicle  ON vehicle_material(vehicle_id);
CREATE INDEX idx_veh_material_material ON vehicle_material(material_id);
`;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function vehicleModels(faker: Faker): unknown[][] {
  const seen = new Set<string>();
  const rows: unknown[][] = [];
  while (rows.length < MODEL_COUNT) {
    const make = faker.vehicle.manufacturer();
    const model = faker.vehicle.model();
    const year = faker.number.int({ min: 1990, max: 2025 });
    const key = `${make}|${model}|${year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push([make, model, year]);
  }
  return rows;
}

// Rows are assumed inserted as ids 1..n (fresh IDENTITY sequence), so foreign
// keys can be assigned directly.
function vehicles(faker: Faker, modelCount: number): unknown[][] {
  const usedVins = new Set<string>();
  const rows: unknown[][] = [];
  while (rows.length < VEHICLE_COUNT) {
    let vin: string;
    do {
      vin = faker.vehicle.vin();
    } while (usedVins.has(vin));
    usedVins.add(vin);

    const licensePlate = faker.datatype.boolean(0.9)
      ? faker.vehicle.vrm()
      : null;
    const vehicleModelId = faker.number.int({ min: 1, max: modelCount });
    const status = faker.helpers.weightedArrayElement([
      { value: 'ACTIVE', weight: 75 },
      { value: 'SOLD', weight: 20 },
      { value: 'SCRAPPED', weight: 5 },
    ]);
    const warrantyEndDate =
      status === 'SCRAPPED' || faker.datatype.boolean(0.2)
        ? null
        : isoDate(faker.date.future({ years: 5 }));

    rows.push([vin, licensePlate, vehicleModelId, warrantyEndDate, status]);
  }
  return rows;
}

function customerVehicles(faker: Faker, vehicleCount: number): unknown[][] {
  const rows: unknown[][] = [];
  for (let vehicleId = 1; vehicleId <= vehicleCount; vehicleId++) {
    if (faker.datatype.boolean(0.2)) {
      const firstOwnedFrom = faker.date.past({ years: 8 });
      const transferDate = faker.date.between({
        from: firstOwnedFrom,
        to: faker.defaultRefDate(),
      });
      const firstCustomerId = faker.number.int({
        min: 1,
        max: CUSTOMER_ID_RANGE,
      });
      let secondCustomerId: number;
      do {
        secondCustomerId = faker.number.int({ min: 1, max: CUSTOMER_ID_RANGE });
      } while (secondCustomerId === firstCustomerId);

      rows.push([
        firstCustomerId,
        vehicleId,
        isoDate(firstOwnedFrom),
        isoDate(transferDate),
        'TRANSFERRED',
      ]);
      rows.push([
        secondCustomerId,
        vehicleId,
        isoDate(transferDate),
        null,
        'CURRENT',
      ]);
    } else {
      const customerId = faker.number.int({ min: 1, max: CUSTOMER_ID_RANGE });
      rows.push([
        customerId,
        vehicleId,
        isoDate(faker.date.past({ years: 5 })),
        null,
        'CURRENT',
      ]);
    }
  }
  return rows;
}

function vehicleMaterials(faker: Faker, vehicleCount: number): unknown[][] {
  const rows: unknown[][] = [];
  for (let vehicleId = 1; vehicleId <= vehicleCount; vehicleId++) {
    const materialIds = faker.helpers.uniqueArray(
      () => faker.number.int({ min: 1, max: MATERIAL_ID_RANGE }),
      faker.number.int({ min: 0, max: 5 }),
    );
    for (const materialId of materialIds) {
      const count = faker.number.int({ min: 1, max: 4 });
      const description = faker.datatype.boolean(0.7)
        ? faker.commerce.productName()
        : null;
      rows.push([
        vehicleId,
        materialId,
        count,
        description,
        faker.date.past({ years: 3 }).toISOString(),
      ]);
    }
  }
  return rows;
}

export const vehicleDataset: SqlDataset = {
  name: 'vehicle',
  description: `vehicle_model, vehicle, customer_vehicle and vehicle_material tables (vehicle_db), ${VEHICLE_COUNT} vehicles`,
  build(faker) {
    const models = vehicleModels(faker);
    const vehicleRows = vehicles(faker, models.length);
    return {
      schemaSql: CREATE_TABLE_SQL,
      tables: [
        {
          table: 'vehicle_model',
          columns: ['make', 'model', 'year'],
          rows: models,
        },
        {
          table: 'vehicle',
          columns: [
            'vin',
            'license_plate',
            'vehicle_model_id',
            'warranty_end_date',
            'status',
          ],
          rows: vehicleRows,
        },
        {
          table: 'customer_vehicle',
          columns: [
            'customer_id',
            'vehicle_id',
            'owned_from',
            'owned_to',
            'status',
          ],
          rows: customerVehicles(faker, vehicleRows.length),
        },
        {
          table: 'vehicle_material',
          columns: [
            'vehicle_id',
            'material_id',
            'count',
            'description',
            'installed_at',
          ],
          rows: vehicleMaterials(faker, vehicleRows.length),
        },
      ],
    };
  },
};
