/**
 * Pre-renders the docs site to static files for Vercel (or any static host).
 * Pages are rendered in-process with the same templates and deterministic data
 * the Nest app serves; the playground calls the API at API_URL directly.
 *
 *   API_URL=https://api.example.com SITE_URL=https://example.com npm run build:site
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseOptions } from '../common/query.js';
import { ResourceRegistry } from '../resources/resource.registry.js';
import { ResourcesService } from '../resources/resources.service.js';
import {
  llmsFullTxt,
  llmsTxt,
  robotsTxt,
  sitemapXml,
} from '../site/discovery.js';
import type { SiteUrls } from '../site/html.js';
import {
  homePage,
  notFoundPage,
  resourcePage,
  resourcesIndexPage,
} from '../site/pages.js';

const OUT_DIR = join(process.cwd(), 'site-dist');
const PUBLIC_DIR = join(process.cwd(), 'public');

const trim = (url?: string) => url?.trim().replace(/\/+$/, '') || undefined;

function resolveUrls(): SiteUrls {
  const api = trim(process.env.API_URL);
  if (!api && process.env.VERCEL) {
    throw new Error(
      'API_URL is not set. Add it in Vercel → Project → Settings → Environment Variables (e.g. your Railway URL).',
    );
  }
  // VERCEL_PROJECT_PRODUCTION_URL is a Vercel system env var (host only).
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const site =
    trim(process.env.SITE_URL) ??
    (vercelHost ? `https://${vercelHost}` : 'http://localhost:4173');
  return { site, api: api ?? 'http://localhost:3000' };
}

function write(path: string, content: string): void {
  const file = join(OUT_DIR, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function main(): void {
  const urls = resolveUrls();
  const registry = new ResourceRegistry();
  const service = new ResourcesService(registry);
  const defaults = parseOptions({});
  const catalog = registry.catalog();

  rmSync(OUT_DIR, { recursive: true, force: true });
  cpSync(PUBLIC_DIR, OUT_DIR, { recursive: true });

  write(
    'index.html',
    homePage(urls, catalog, service.list('users', { ...defaults, limit: 3 })),
  );
  write('resources.html', resourcesIndexPage(urls, catalog));
  for (const info of catalog) {
    write(
      `resources/${info.name}.html`,
      resourcePage(
        urls,
        info,
        service.get(info.name, 1, defaults),
        service.list(info.name, { ...defaults, limit: 3 }),
      ),
    );
  }
  write('404.html', notFoundPage(urls, 'this page'));
  write('robots.txt', robotsTxt(urls.site));
  write('sitemap.xml', sitemapXml(urls, catalog));
  write('llms.txt', llmsTxt(urls, catalog));
  write(
    'llms-full.txt',
    llmsFullTxt(urls, catalog, (name) => service.get(name, 1, defaults)),
  );

  console.log(
    `Built ${catalog.length + 3} pages to ${OUT_DIR} (site: ${urls.site}, api: ${urls.api})`,
  );
}

main();
