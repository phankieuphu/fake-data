import { SUPPORTED_LOCALES } from '../common/faker.factory.js';
import { RESOURCE_DEFINITIONS } from '../resources/definitions/index.js';
import type { ResourceInfo } from '../resources/resource.registry.js';
import type { Entity } from '../resources/resource.types.js';
import {
  REPO_URL,
  SITE_NAME,
  codeBlock,
  esc,
  jsonBlock,
  layout,
  snippetTabs,
} from './html.js';

const RESOURCE_COUNT = RESOURCE_DEFINITIONS.length;
const TOPIC_COUNT = new Set(RESOURCE_DEFINITIONS.map((d) => d.topic)).size;

export const HOME_TITLE = `${SITE_NAME}: free fake data REST API for testing, prototyping & demos`;
export const HOME_DESCRIPTION =
  `Free fake JSON REST API with ${RESOURCE_COUNT} resources (users, products, orders, posts, companies, transactions, movies, flights…). ` +
  'Deterministic, relational, localized, with CSV/SQL export and a custom schema generator. No API key, CORS enabled.';

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is Faker Data API?',
    a: `A free REST API that returns realistic fake JSON for frontend development, testing, tutorials, prototypes and demos. It has ${RESOURCE_COUNT} ready-made resources across ${TOPIC_COUNT} topics and a generator for custom schemas.`,
  },
  {
    q: 'Do I need an API key or account?',
    a: 'No. Every endpoint is public, CORS is enabled, and you can call it straight from the browser, a test suite or a no-code tool.',
  },
  {
    q: 'Is the fake data stable between requests?',
    a: 'Yes. The same id, seed and locale always return the same record, so screenshots, snapshot tests and tutorials stay consistent. Change ?seed= to get a different stable dataset.',
  },
  {
    q: 'How is it different from JSONPlaceholder or DummyJSON?',
    a: `Same idea, more coverage: ${RESOURCE_COUNT} resources (e-commerce, finance, travel, healthcare, logs…), related records that point at real ids, 70+ locales, CSV and SQL export, bulk export up to 5,000 rows, and a custom schema generator built on Faker.`,
  },
  {
    q: 'Can I POST, PUT, PATCH or DELETE?',
    a: 'Yes. Writes are simulated: the API validates the target and returns what a real API would (new id, merged record, deleted flag), but nothing is stored.',
  },
  {
    q: 'Can I generate my own data shape?',
    a: 'Yes. Call /api/generate with field=module.method pairs, for example /api/generate?name=person.fullName&email=internet.email, or POST a nested JSON schema.',
  },
  {
    q: 'Can I seed a database?',
    a: 'Yes. Add ?format=sql to any list or export endpoint to get INSERT statements, or download a full Postgres seed script from /api/datasets.',
  },
];

function topicsOf(resources: ResourceInfo[]): string[] {
  return [...new Set(resources.map((r) => r.topic))];
}

function catalogHtml(resources: ResourceInfo[]): string {
  return topicsOf(resources)
    .map((topic) => {
      const cards = resources
        .filter((r) => r.topic === topic)
        .map(
          (r) => `<a class="card" href="/resources/${r.name}">
  <span class="card-title">${esc(r.name)}</span>
  <span class="card-meta">${r.total.toLocaleString('en')} items</span>
  <span class="card-desc">${esc(r.description)}</span>
</a>`,
        )
        .join('');
      return `<section class="topic"><h3>${esc(topic)}</h3><div class="cards">${cards}</div></section>`;
    })
    .join('');
}

const PLAYGROUND = (
  resources: ResourceInfo[],
  initial: unknown,
  initialUrl: string,
) => `
<section id="playground" class="panel">
  <div class="panel-head">
    <h2>Playground</h2>
    <p>Build a request, run it, copy the JSON. All options map to query parameters.</p>
  </div>
  <form class="pg" data-playground data-resources="${esc(
    JSON.stringify(
      resources.map((r) => ({
        name: r.name,
        total: r.total,
        children: r.children,
      })),
    ),
  )}" data-locales="${esc(JSON.stringify(SUPPORTED_LOCALES))}">
    <div class="pg-grid">
      <label>Resource<select name="resource"></select></label>
      <label>Endpoint<select name="mode">
        <option value="list">List (paginated)</option>
        <option value="item">Single item</option>
        <option value="nested">Nested list</option>
        <option value="random">Random</option>
        <option value="export">Export</option>
      </select></label>
      <label data-show="item nested">ID<input name="id" type="number" min="1" value="1"></label>
      <label data-show="nested">Child<select name="child"></select></label>
      <label data-show="list nested">Page<input name="page" type="number" min="1" placeholder="1"></label>
      <label data-show="list nested">Limit<input name="limit" type="number" min="1" max="100" placeholder="10"></label>
      <label data-show="random export">Count<input name="count" type="number" min="1" max="5000" placeholder="5"></label>
      <label>Seed<input name="seed" placeholder="1"></label>
      <label>Locale<select name="locale"></select></label>
      <label data-show="list nested export">Format<select name="format"><option>json</option><option>csv</option><option>sql</option></select></label>
      <label class="wide">Fields<input name="fields" placeholder="id,name,email (optional)"></label>
    </div>
    <div class="urlbar">
      <span class="method">GET</span>
      <input name="url" readonly aria-label="Request URL">
      <button type="button" class="btn ghost" data-copy-url>Copy URL</button>
      <button type="submit" class="btn primary">Send</button>
    </div>
  </form>
  <div class="response">
    <div class="response-head"><span data-status>200 OK</span><span data-timing></span>
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-download>Download</button>
    </div>
    <div data-output>${jsonBlock(initial, 'Response')}</div>
  </div>
  <h3 class="sub">Use it in your code</h3>
  <div data-playground-snippets>${snippetTabs(initialUrl)}</div>
</section>`;

const GENERATOR = `
<section id="generator" class="panel">
  <div class="panel-head">
    <h2>Custom schema generator</h2>
    <p>Describe any shape with <code>"field": "module.method"</code> (any <a href="/api/generate/methods">Faker method</a>). Nested objects work too.</p>
  </div>
  <form class="gen" data-generator>
    <textarea name="schema" spellcheck="false" rows="9" aria-label="Schema JSON">{
  "name": "person.fullName",
  "email": "internet.email",
  "avatar": "image.avatar",
  "address": {
    "city": "location.city",
    "country": "location.country"
  },
  "joinedAt": "date.past"
}</textarea>
    <div class="gen-controls">
      <label>Count<input name="count" type="number" min="1" max="1000" value="3"></label>
      <label>Seed<input name="seed" placeholder="1"></label>
      <label>Locale<select name="locale"></select></label>
      <button type="submit" class="btn primary">Generate</button>
    </div>
  </form>
  <div class="response"><div data-output></div></div>
  <div data-generator-snippet></div>
</section>`;

export function homePage(
  base: string,
  resources: ResourceInfo[],
  sample: unknown,
): string {
  const topics = topicsOf(resources);
  const body = `
<section class="hero">
  <p class="eyebrow">Free · No API key · CORS enabled · Open source</p>
  <h1>Fake data REST API for testing, prototyping &amp; demos</h1>
  <p class="lead">${resources.length} realistic resources across ${topics.length} topics: users, products, orders, posts, companies, transactions, movies, flights and more.
  Stable per seed, linked by real ids, available in 70+ locales, and exportable as JSON, CSV or SQL.</p>
  <div class="hero-cta">
    <a class="btn primary" href="#playground">Try it live</a>
    <a class="btn" href="/resources">Browse resources</a>
    <a class="btn ghost" href="/docs">API reference</a>
  </div>
  <div class="hero-code">${snippetTabs(`${base}/api/users/1`)}</div>
</section>

<section class="features">
  <div><h3>Deterministic</h3><p>Same <code>id</code> + <code>seed</code> → same record. Great for snapshot tests, docs and screenshots.</p></div>
  <div><h3>Relational</h3><p><code>userId</code>, <code>productId</code>… point to real records. Nested routes like <code>/users/1/posts</code>.</p></div>
  <div><h3>Any format</h3><p><code>?format=csv</code> or <code>?format=sql</code> on any list. Bulk export up to 5,000 rows.</p></div>
  <div><h3>Localized</h3><p><code>?locale=de</code>, <code>ja</code>, <code>vi</code>, <code>pt_BR</code>… ${SUPPORTED_LOCALES.length} locales.</p></div>
  <div><h3>Custom shapes</h3><p><code>/api/generate?name=person.fullName</code>: any Faker method, any structure.</p></div>
  <div><h3>Mock writes</h3><p>POST / PUT / PATCH / DELETE respond like a real API. Nothing is stored.</p></div>
</section>

${PLAYGROUND(resources, sample, `${base}/api/users?limit=3`)}

<section class="panel" id="resources">
  <div class="panel-head"><h2>Resources</h2><p>Click one for its fields, example JSON and endpoints.</p></div>
  ${catalogHtml(resources)}
</section>

${GENERATOR}

<section class="panel" id="reference">
  <div class="panel-head"><h2>Endpoint cheat sheet</h2></div>
  ${codeBlock(
    [
      'GET    /api/resources                       catalog of all resources',
      'GET    /api/{resource}?page=1&limit=10       paginated list (max 100)',
      'GET    /api/{resource}/{id}                  one record',
      'GET    /api/{resource}/{id}/{child}          nested list, e.g. /api/users/1/posts',
      'GET    /api/{resource}/random?count=5        random records',
      'GET    /api/{resource}/export?count=1000&format=csv   bulk export (max 5000)',
      'GET    /api/generate?field=module.method     custom schema',
      'POST   /api/generate                         custom nested schema (JSON body)',
      'GET    /api/datasets/customer.sql            Postgres seed script',
      'POST   /api/{resource}                       simulated create',
      'PUT    /api/{resource}/{id}                  simulated replace',
      'PATCH  /api/{resource}/{id}                  simulated update',
      'DELETE /api/{resource}/{id}                  simulated delete',
      '',
      'Query params: seed, locale, fields=id,name, format=json|csv|sql',
    ].join('\n'),
    'Endpoints',
  )}
</section>

<section class="panel faq" id="faq">
  <div class="panel-head"><h2>FAQ</h2></div>
  ${FAQ.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
</section>`;

  return layout({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonical: `${base}/`,
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebAPI',
        name: SITE_NAME,
        description: HOME_DESCRIPTION,
        url: `${base}/`,
        documentation: `${base}/docs`,
        termsOfService: REPO_URL,
        isAccessibleForFree: true,
        keywords:
          'fake data API, mock API, fake JSON, test data, dummy data, JSONPlaceholder alternative, Faker, REST API for testing',
        provider: { '@type': 'Organization', name: SITE_NAME, url: REPO_URL },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  });
}

export function resourcesIndexPage(
  base: string,
  resources: ResourceInfo[],
): string {
  return layout({
    title: `All ${resources.length} fake data resources | ${SITE_NAME}`,
    description: `Browse ${resources.length} free fake JSON REST resources by topic: ${topicsOf(resources).join(', ')}.`,
    canonical: `${base}/resources`,
    body: `<section class="hero small"><h1>Resources</h1>
<p class="lead">${resources.length} fake data resources grouped by topic. Each one supports lists, single records, random picks, export and simulated writes.</p></section>
<section class="panel">${catalogHtml(resources)}</section>`,
  });
}

/** Describes the type of each top-level field from a sample record. */
function fieldRows(sample: Entity): string {
  return Object.entries(sample)
    .map(([key, value]) => {
      const type = Array.isArray(value)
        ? 'array'
        : value === null
          ? 'null'
          : typeof value;
      const example =
        typeof value === 'object' && value !== null
          ? JSON.stringify(value).slice(0, 60) +
            (JSON.stringify(value).length > 60 ? '…' : '')
          : String(value).slice(0, 60);
      return `<tr><td><code>${esc(key)}</code></td><td>${type}</td><td class="muted">${esc(example)}</td></tr>`;
    })
    .join('');
}

export function resourcePage(
  base: string,
  info: ResourceInfo,
  sample: Entity,
  list: unknown,
): string {
  const api = `${base}/api/${info.name}`;
  const nested = info.parent
    ? `<li><code>GET /api/${info.parent.resource}/{id}/${info.name}</code>: the ${info.parent.perParent} ${info.name} of one ${info.parent.resource.replace(/s$/, '')} (<a href="/api/${info.parent.resource}/1/${info.name}">example</a>)</li>`
    : '';
  const children = info.children
    .map(
      (child) =>
        `<li><code>GET /api/${info.name}/{id}/${child}</code> (<a href="/api/${info.name}/1/${child}">example</a>)</li>`,
    )
    .join('');
  const title = `Fake ${info.name} API: free ${info.name} JSON for testing | ${SITE_NAME}`;
  const description = `${info.description}. ${info.total.toLocaleString('en')} free fake ${info.name} records as JSON, CSV or SQL. No API key. GET ${api}`;

  const body = `
<nav class="crumbs"><a href="/">Home</a> / <a href="/resources">Resources</a> / ${esc(info.name)}</nav>
<section class="hero small">
  <p class="eyebrow">${esc(info.topic)} · ${info.total.toLocaleString('en')} records</p>
  <h1>Fake ${esc(info.name)} API</h1>
  <p class="lead">${esc(info.description)}. Free, stable fake data for testing and demos.</p>
  <div class="urlbar static"><span class="method">GET</span><input readonly value="${esc(api)}" aria-label="Endpoint URL"><button type="button" class="btn ghost" data-copy-text="${esc(api)}">Copy</button>
  <a class="btn primary" href="/?resource=${esc(info.name)}#playground">Open in playground</a></div>
</section>

<div class="split">
  <section class="panel">
    <div class="panel-head"><h2>Example: <code>GET /api/${esc(info.name)}/1</code></h2></div>
    ${jsonBlock(sample, `${info.name}/1`)}
  </section>
  <section class="panel">
    <div class="panel-head"><h2>Fields</h2></div>
    <div class="table-wrap"><table><thead><tr><th>Field</th><th>Type</th><th>Example</th></tr></thead><tbody>${fieldRows(sample)}</tbody></table></div>
  </section>
</div>

<section class="panel">
  <div class="panel-head"><h2>Endpoints</h2></div>
  <ul class="endpoints">
    <li><code>GET /api/${info.name}?page=1&amp;limit=10</code>: paginated list (<a href="/api/${info.name}">try</a>)</li>
    <li><code>GET /api/${info.name}/{id}</code>: one record, ids 1–${info.total.toLocaleString('en')} (<a href="/api/${info.name}/1">try</a>)</li>
    <li><code>GET /api/${info.name}/random?count=5</code>: random records (<a href="/api/${info.name}/random?count=5">try</a>)</li>
    <li><code>GET /api/${info.name}/export?count=1000&amp;format=csv</code>: bulk export as JSON, CSV or SQL (<a href="/api/${info.name}/export?count=100&amp;format=csv">CSV</a> · <a href="/api/${info.name}/export?count=100&amp;format=sql">SQL</a>)</li>
    ${nested}${children}
    <li><code>POST /api/${info.name}</code>, <code>PUT|PATCH|DELETE /api/${info.name}/{id}</code>: simulated writes</li>
  </ul>
  <h3 class="sub">Code</h3>
  ${snippetTabs(`${api}?limit=5`)}
</section>

<section class="panel">
  <div class="panel-head"><h2>Example: <code>GET /api/${esc(info.name)}?limit=3</code></h2></div>
  ${jsonBlock(list, `${info.name}?limit=3`)}
</section>`;

  return layout({
    title,
    description,
    canonical: `${base}/resources/${info.name}`,
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: `Fake ${info.name}`,
        description,
        url: `${base}/resources/${info.name}`,
        isAccessibleForFree: true,
        license: 'https://opensource.org/licenses/ISC',
        creator: { '@type': 'Organization', name: SITE_NAME, url: REPO_URL },
        distribution: [
          {
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: api,
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'text/csv',
            contentUrl: `${api}/export?format=csv`,
          },
          {
            '@type': 'DataDownload',
            encodingFormat: 'application/sql',
            contentUrl: `${api}/export?format=sql`,
          },
        ],
      },
    ],
  });
}

export function notFoundPage(base: string, name: string): string {
  return layout({
    title: `Not found | ${SITE_NAME}`,
    description: 'Resource not found.',
    canonical: `${base}/resources`,
    body: `<section class="hero small"><h1>No resource called “${esc(name)}”</h1><p class="lead"><a href="/resources">Browse all resources</a> or <a href="/#generator">generate a custom shape</a>.</p></section>`,
  });
}
