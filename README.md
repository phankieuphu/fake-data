# faker-data

Generates fake data as ready-to-run PostgreSQL `INSERT` scripts, for seeding
local/dev databases without a live DB connection.

## Usage

```bash
npm install

node main.js customer   # generate customer.sql
node main.js vehicle    # generate vehicle.sql
node main.js            # or `node main.js all` — generate everything
```

Each command writes a `.sql` file (schema + `INSERT` statements) to the
project root, ready to run against Postgres, e.g.:

```bash
psql -d customer_db -f customer.sql
psql -d vehicle_db   -f vehicle.sql
```

## Structure

- `main.js` — entry point. Picks which generator(s) to run.
- `customer.js` — generates `customer` rows (`customer_db`).
- `vehicle.js` — generates `vehicle_model`, `vehicle`, `customer_vehicle`,
  and `vehicle_material` rows (`vehicle_db`).
- `write-file-utils.js` — shared helper that writes a table's `CREATE TABLE`
  statement plus batched `INSERT` statements to a `.sql` file.
- `sql-utils.js` — low-level SQL helpers (`INSERT` statement building, and
  batch inserts for live DB usage via `pg`).

## Notes

- Generation is offline: rows aren't inserted into a real database, so
  primary keys are assumed to follow a fresh `IDENTITY` sequence starting at
  1, in insertion order. Run the generated `.sql` against an empty table.
- `vehicle.js`'s `customer_vehicle.customer_id` and
  `vehicle_material.material_id` reference other services'
  data (customer-service, dealership-service) with no real FK — the
  generator just picks plausible ids in the same range `customer.js`
  produces (1..1000 by default).
- Row counts and id ranges are configured via constants at the top of
  `customer.js` / `vehicle.js`.
