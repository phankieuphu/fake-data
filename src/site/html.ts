export const SITE_NAME = 'Faker Data API';
export const REPO_URL =
  process.env.REPO_URL ?? 'https://github.com/phankieuphu/fake-data';

export const esc = (value: unknown): string =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

/** Pretty JSON inside a copyable block; app.js adds highlighting + copy. */
export const jsonBlock = (value: unknown, label = 'JSON'): string =>
  `<pre class="code json" data-copy data-label="${esc(label)}"><code>${esc(
    JSON.stringify(value, null, 2),
  )}</code></pre>`;

export const codeBlock = (code: string, label: string): string =>
  `<pre class="code" data-copy data-label="${esc(label)}"><code>${esc(code)}</code></pre>`;

export interface Snippet {
  id: string;
  label: string;
  code: string;
}

export function snippets(url: string): Snippet[] {
  return [
    {
      id: 'fetch',
      label: 'fetch',
      code: `const res = await fetch('${url}');\nconst data = await res.json();\nconsole.log(data);`,
    },
    { id: 'curl', label: 'curl', code: `curl '${url}'` },
    {
      id: 'axios',
      label: 'axios',
      code: `import axios from 'axios';\n\nconst { data } = await axios.get('${url}');`,
    },
    {
      id: 'python',
      label: 'Python',
      code: `import requests\n\ndata = requests.get('${url}').json()\nprint(data)`,
    },
  ];
}

export function snippetTabs(url: string): string {
  const items = snippets(url);
  const tabs = items
    .map(
      (s, i) =>
        `<button type="button" role="tab" data-tab="${s.id}" aria-selected="${i === 0}">${s.label}</button>`,
    )
    .join('');
  const panels = items
    .map(
      (s, i) =>
        `<div role="tabpanel" data-panel="${s.id}"${i === 0 ? '' : ' hidden'}>${codeBlock(s.code, s.label)}</div>`,
    )
    .join('');
  return `<div class="tabs" data-tabs data-snippets="${esc(url)}"><div class="tablist" role="tablist">${tabs}</div>${panels}</div>`;
}

export interface LayoutOptions {
  title: string;
  description: string;
  canonical: string;
  body: string;
  jsonLd?: object[];
}

export function layout(o: LayoutOptions): string {
  const ld = (o.jsonLd ?? [])
    .map(
      (data) =>
        `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${esc(o.canonical)}">
<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt">
<link rel="alternate" type="application/json" title="OpenAPI" href="/openapi.json">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(o.canonical)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%232563eb'/%3E%3Ctext x='16' y='22' font-family='monospace' font-size='16' font-weight='700' fill='white' text-anchor='middle'%3E%7B%7D%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/assets/styles.css">
${ld}
</head>
<body>
<header class="topbar"><div class="wrap topbar-inner">
  <a class="brand" href="/"><span class="logo">{}</span>${SITE_NAME}</a>
  <nav>
    <a href="/resources">Resources</a>
    <a href="/#playground">Playground</a>
    <a href="/#generator">Generator</a>
    <a href="/docs">API reference</a>
    <a href="${esc(REPO_URL)}" rel="noopener">GitHub</a>
  </nav>
</div></header>
<main class="wrap">
${o.body}
</main>
<footer class="wrap footer">
  <p>${SITE_NAME}: free fake REST data for coding, testing, prototyping and demos. Data is generated, never stored. Open source on <a href="${esc(REPO_URL)}">GitHub</a>.</p>
  <p><a href="/llms.txt">llms.txt</a> · <a href="/openapi.json">openapi.json</a> · <a href="/sitemap.xml">sitemap.xml</a> · <a href="/api/resources">/api/resources</a></p>
</footer>
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}
