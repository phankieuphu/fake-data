# Faker Data API

A free, public REST API that serves fake data for coding, prototyping, demos,
tutorials and frontend work — like JSONPlaceholder / DummyJSON, but with
**47 resources across 12 topics**. It runs on **NestJS** and **Faker**.

- **Deterministic**: the same `id` + `seed` + `locale` always returns the same entity, with nothing stored.
- **Relational**: `userId`, `productId` and similar ids point at real entities, e.g. cart items match `/api/products/:id`.
- **Nested routes**: `/api/users/1/posts`, `/api/posts/1/comments`, `/api/companies/1/employees`, …
- **Localized**: `?locale=vi|de|fr|ja|pt_BR|…`, any of Faker's 70+ locales.
- **Many formats**: JSON, CSV or SQL `INSERT`s from any list (`?format=csv`).
- **Custom schemas**: `/api/generate?name=person.fullName&email=internet.email`.
- **Simulated writes**: POST / PUT / PATCH / DELETE answer like a real API, but nothing is persisted.
- **Docs website** at `/`: a live playground, copyable JSON and code snippets (fetch, curl, axios, Python), and one page per resource (`/resources/users`).
- **Swagger** at `/docs`, OpenAPI at `/openapi.json`, CORS enabled and rate limiting.
- **AI-ready**: `/llms.txt`, `/llms-full.txt`, `robots.txt` that allows AI crawlers, `sitemap.xml`, and schema.org JSON-LD.

## Quick start

```bash
npm install
npm run start:dev        # http://localhost:3000  (docs: /docs)
```

```js
const res = await fetch('http://localhost:3000/api/products?limit=5');
const { data, meta } = await res.json();
```

## Resources

| Topic | Resources |
| --- | --- |
| social | `users`, `posts`, `comments`, `todos`, `albums`, `photos`, `notifications`, `messages` |
| e-commerce | `categories`, `products`, `reviews`, `carts`, `orders`, `coupons`, `stores` |
| business | `companies`, `employees`, `jobs`, `customers`, `invoices` |
| finance | `bank-accounts`, `transactions`, `credit-cards`, `stocks`, `crypto` |
| entertainment | `movies`, `books`, `songs`, `games` |
| food | `recipes`, `restaurants` |
| travel | `flights`, `hotels`, `bookings`, `addresses` |
| automotive | `vehicles` |
| education | `courses`, `students` |
| healthcare | `patients`, `appointments` |
| tech | `repositories`, `logs`, `devices` |
| misc | `quotes`, `events`, `pets`, `weather` |

`GET /api/resources` returns the live catalog with totals and nested routes.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/:resource` | Paginated: `page`, `limit` (max 100) |
| GET | `/api/:resource/:id` | One entity |
| GET | `/api/:resource/:id/:child` | Nested, e.g. `/api/users/1/todos` |
| GET | `/api/:resource/random?count=5` | Random entities |
| GET | `/api/:resource/export?count=1000&format=csv` | Bulk download (max 5000) |
| POST | `/api/:resource` | Simulated create |
| PUT / PATCH / DELETE | `/api/:resource/:id` | Simulated update and delete |
| GET / POST | `/api/generate` | Custom schema generator |
| GET | `/api/generate/methods` | All usable `module.method` generators |
| GET | `/api/datasets/:name.sql` | Full Postgres seed scripts (`customer`, `vehicle`) |
| GET | `/api/resources`, `/api/locales`, `/api/health` | Metadata |

Common query parameters:

- `seed`: a different, still stable dataset. Defaults to `1`.
- `locale`: defaults to `en`.
- `fields=id,title,price`: return only these fields.
- `format=json|csv|sql`: output format.

### Custom schema

```bash
curl 'http://localhost:3000/api/generate?count=3&name=person.fullName&email=internet.email&city=location.city'

curl -X POST http://localhost:3000/api/generate -H 'content-type: application/json' -d '{
  "count": 3, "seed": 42, "locale": "de",
  "schema": { "name": "person.fullName", "address": { "city": "location.city", "zip": "location.zipCode" } }
}'
```

## SQL seed datasets (offline)

The original SQL generators are still available, both over HTTP
(`/api/datasets/customer.sql`) and as a CLI that writes to `data/`:

```bash
npm run generate:sql                 # all datasets
npm run generate:sql -- vehicle      # one dataset
npm run generate:sql -- customer 42  # custom seed
psql -d customer_db -f data/customer.sql
```

Primary keys follow a fresh `IDENTITY` sequence starting at 1, so run the
scripts against empty tables. In `vehicle.sql`, `customer_vehicle.customer_id`
and `vehicle_material.material_id` reference other services and have no foreign key.

## Configuration

| Env var | Default | |
| --- | --- | --- |
| `PORT` | `3000` | |
| `PUBLIC_URL` | request host | Public origin used in canonical links, sitemap and llms.txt, e.g. `https://fakedata.example.com` |
| `REPO_URL` | this repo | GitHub link shown on the site |
| `RATE_LIMIT` | `120` | Requests per window per IP |
| `RATE_LIMIT_TTL_MS` | `60000` | Rate-limit window |

## Deploy

```bash
docker build -t faker-data .
docker run -p 3000:3000 faker-data
```

### Railway

`railway.json` builds from the `Dockerfile` and health-checks `/api/health`.
Railway injects `PORT` automatically. Connect the repo in Railway, or run
`railway up`. Set `PUBLIC_URL` to your Railway or custom domain so canonical
links, the sitemap and `llms.txt` use it. Optionally set `RATE_LIMIT` / `RATE_LIMIT_TTL_MS`.

## Docs website & AI discoverability

The docs pages are rendered on the server, so search engines and AI crawlers
(which mostly don't run JavaScript) see the full content. `public/assets/app.js`
only adds interactivity on top.

| URL | Purpose |
| --- | --- |
| `/` | Landing page, playground, resource catalog, generator, FAQ |
| `/resources/:name` | Per-resource page: example JSON, field table, endpoints, code snippets |
| `/llms.txt`, `/llms-full.txt` | [llms.txt](https://llmstxt.org) summary for LLMs and AI agents |
| `/robots.txt`, `/sitemap.xml` | Crawling: GPTBot, ClaudeBot, PerplexityBot and others are explicitly allowed |
| `/openapi.json` | OpenAPI spec for Postman, codegen, and agent tool use |

## Project structure

```
src/
  main.ts, setup.ts, app.module.ts
  common/            faker factory (seeding, locales), query parsing, CSV/SQL serializers
  resources/         generic REST controller + service + registry
    definitions/     one file per topic group — add a resource here
  generator/         custom schema endpoint (/api/generate)
  datasets/          Postgres seed scripts (customer, vehicle)
  cli/generate-sql.ts
  site/              server-rendered docs site, llms.txt, robots.txt, sitemap, health
public/assets/       docs site CSS + JS (playground, copy buttons, highlighting)
test/                e2e tests (vitest + supertest)
```

### Adding a resource

Add an entry to any file in `src/resources/definitions/`:

```ts
{
  name: 'tickets',               // → /api/tickets
  topic: 'tech',
  description: 'Support tickets',
  total: 500,                    // or parent: { resource: 'users', perParent: 5, key: 'userId' }
  generate: ({ faker, ref }) => ({
    subject: faker.hacker.phrase(),
    requesterId: ref('users'),   // a valid id of another resource
    priority: faker.helpers.arrayElement(['low', 'high']),
  }),
}
```

The list, detail, nested, random, export, write, Swagger and landing-page
routes all pick it up automatically.

## Scripts

`npm run build` · `npm run start:prod` · `npm test` · `npm run test:e2e` · `npm run lint` · `npm run format`
