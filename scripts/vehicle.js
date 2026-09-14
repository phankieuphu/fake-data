const path = require("path");
const { faker } = require("@faker-js/faker");
const { writeSqlFile } = require("../utils/write-file-utils");

const MODEL_COUNT = 200;
const VEHICLE_COUNT = 5000;
// customer_id / material_id cross into customer-service / dealership-service
// (Pattern a, no FK) — these ranges just need to look like plausible ids from
// those services. customer.js generates COUNT_CUSTOMER = 1000 customers.
const CUSTOMER_ID_RANGE = 1000;
const MATERIAL_ID_RANGE = 300;
const SQL_OUTPUT_FILE = path.join(__dirname, "..", "data", "vehicle.sql");

const VEHICLE_STATUSES = ["ACTIVE", "SOLD", "SCRAPPED"];
const VEHICLE_STATUS_WEIGHTS = [0.75, 0.2, 0.05];

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

function pickVehicleStatus() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < VEHICLE_STATUSES.length; i++) {
    acc += VEHICLE_STATUS_WEIGHTS[i];
    if (r <= acc) return VEHICLE_STATUSES[i];
  }
  return VEHICLE_STATUSES[VEHICLE_STATUSES.length - 1];
}

function CreateVehicleModels() {
  const seen = new Set();
  const models = [];
  while (models.length < MODEL_COUNT) {
    const make = faker.vehicle.manufacturer();
    const model = faker.vehicle.model();
    const year = faker.number.int({ min: 1990, max: 2025 });
    const key = `${make}|${model}|${year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    models.push([make, model, year]);
  }
  return models;
}

// vehicleModelCount rows are assumed already inserted as ids 1..vehicleModelCount
// (fresh IDENTITY sequence), so vehicle_model_id can be assigned directly.
function CreateVehicles(vehicleModelCount) {
  const usedVins = new Set();
  const vehicles = [];
  while (vehicles.length < VEHICLE_COUNT) {
    let vin;
    do {
      vin = faker.vehicle.vin();
    } while (usedVins.has(vin));
    usedVins.add(vin);

    const licensePlate = faker.datatype.boolean(0.9)
      ? faker.vehicle.vrm()
      : null;
    const vehicleModelId = faker.number.int({ min: 1, max: vehicleModelCount });
    const status = pickVehicleStatus();
    const warrantyEndDate =
      status === "SCRAPPED" || faker.datatype.boolean(0.2)
        ? null
        : faker.date.future({ years: 5 }).toISOString().slice(0, 10);

    vehicles.push([vin, licensePlate, vehicleModelId, warrantyEndDate, status]);
  }
  return vehicles;
}

// vehicleCount rows are assumed already inserted as ids 1..vehicleCount.
function CreateCustomerVehicles(vehicleCount) {
  const rows = [];
  for (let vehicleId = 1; vehicleId <= vehicleCount; vehicleId++) {
    const hasPriorOwner = faker.datatype.boolean(0.2);

    if (hasPriorOwner) {
      const firstOwnedFrom = faker.date.past({ years: 8 });
      const transferDate = faker.date.between({
        from: firstOwnedFrom,
        to: new Date(),
      });
      const firstCustomerId = faker.number.int({ min: 1, max: CUSTOMER_ID_RANGE });
      let secondCustomerId;
      do {
        secondCustomerId = faker.number.int({ min: 1, max: CUSTOMER_ID_RANGE });
      } while (secondCustomerId === firstCustomerId);

      rows.push([
        firstCustomerId,
        vehicleId,
        firstOwnedFrom.toISOString().slice(0, 10),
        transferDate.toISOString().slice(0, 10),
        "TRANSFERRED",
      ]);
      rows.push([
        secondCustomerId,
        vehicleId,
        transferDate.toISOString().slice(0, 10),
        null,
        "CURRENT",
      ]);
    } else {
      const ownedFrom = faker.date.past({ years: 5 });
      const customerId = faker.number.int({ min: 1, max: CUSTOMER_ID_RANGE });
      rows.push([
        customerId,
        vehicleId,
        ownedFrom.toISOString().slice(0, 10),
        null,
        "CURRENT",
      ]);
    }
  }
  return rows;
}

// vehicleCount rows are assumed already inserted as ids 1..vehicleCount.
function CreateVehicleMaterials(vehicleCount) {
  const rows = [];
  for (let vehicleId = 1; vehicleId <= vehicleCount; vehicleId++) {
    const materialCount = faker.number.int({ min: 0, max: 5 });
    const usedMaterialIds = new Set();
    for (let i = 0; i < materialCount; i++) {
      let materialId;
      do {
        materialId = faker.number.int({ min: 1, max: MATERIAL_ID_RANGE });
      } while (usedMaterialIds.has(materialId));
      usedMaterialIds.add(materialId);

      const count = faker.number.int({ min: 1, max: 4 });
      const description = faker.datatype.boolean(0.7)
        ? faker.commerce.productName()
        : null;
      const installedAt = faker.date.past({ years: 3 }).toISOString();

      rows.push([vehicleId, materialId, count, description, installedAt]);
    }
  }
  return rows;
}

function generate(outputFile = SQL_OUTPUT_FILE) {
  const vehicleModels = CreateVehicleModels();
  const vehicles = CreateVehicles(vehicleModels.length);
  const customerVehicles = CreateCustomerVehicles(vehicles.length);
  const vehicleMaterials = CreateVehicleMaterials(vehicles.length);

  writeSqlFile(outputFile, CREATE_TABLE_SQL, [
    { table: "vehicle_model", columns: ["make", "model", "year"], rows: vehicleModels },
    {
      table: "vehicle",
      columns: ["vin", "license_plate", "vehicle_model_id", "warranty_end_date", "status"],
      rows: vehicles,
    },
    {
      table: "customer_vehicle",
      columns: ["customer_id", "vehicle_id", "owned_from", "owned_to", "status"],
      rows: customerVehicles,
    },
    {
      table: "vehicle_material",
      columns: ["vehicle_id", "material_id", "count", "description", "installed_at"],
      rows: vehicleMaterials,
    },
  ]);

  console.log(`Wrote ${vehicleModels.length} vehicle_model rows`);
  console.log(`Wrote ${vehicles.length} vehicle rows`);
  console.log(`Wrote ${customerVehicles.length} customer_vehicle rows`);
  console.log(`Wrote ${vehicleMaterials.length} vehicle_material rows`);
  console.log(`Wrote SQL to ${outputFile}`);
  return outputFile;
}

module.exports = {
  CreateVehicleModels,
  CreateVehicles,
  CreateCustomerVehicles,
  CreateVehicleMaterials,
  generate,
};
