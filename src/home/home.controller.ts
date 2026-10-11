import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResourceRegistry } from '../resources/resource.registry.js';

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );

@ApiTags('meta')
@Controller()
export class HomeController {
  private readonly startedAt = Date.now();

  constructor(private readonly registry: ResourceRegistry) {}

  @Get('api/health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
    };
  }

  @Get()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html; charset=utf-8')
  home(): string {
    const resources = this.registry.catalog();
    const topics = [...new Set(resources.map((r) => r.topic))];
    const sections = topics
      .map((topic) => {
        const rows = resources
          .filter((r) => r.topic === topic)
          .map((r) => {
            const nested = r.parent
              ? `<code>${escape(r.parent.endpoint)}</code>`
              : '';
            return `<tr><td><a href="${r.endpoint}">${r.endpoint}</a></td><td>${r.total.toLocaleString('en')}</td><td>${escape(r.description)} ${nested}</td></tr>`;
          })
          .join('');
        return `<h2>${escape(topic)}</h2><table><thead><tr><th>Endpoint</th><th>Items</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`;
      })
      .join('');

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Faker Data API</title>
<style>
:root{--bg:#fff;--fg:#1d1d1f;--muted:#6e6e73;--line:#e5e5ea;--accent:#0a66c2;--code:#f4f4f6}
@media (prefers-color-scheme:dark){:root{--bg:#111214;--fg:#ececf1;--muted:#9a9aa3;--line:#2a2b30;--accent:#5aa9ff;--code:#1c1d21}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:1000px;margin:0 auto;padding:32px 16px 64px}
h1{margin:0 0 4px;font-size:28px}h2{margin:32px 0 8px;font-size:18px;text-transform:capitalize}
p{color:var(--muted);margin:4px 0}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
code,pre{background:var(--code);border-radius:6px;font:13px ui-monospace,SFMono-Regular,Menlo,monospace}code{padding:1px 5px}
pre{padding:12px 14px;overflow-x:auto;border:1px solid var(--line)}
table{width:100%;border-collapse:collapse;display:block;overflow-x:auto}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:500;font-size:13px}td:nth-child(2){font-variant-numeric:tabular-nums;color:var(--muted)}
</style></head><body><main>
<h1>Faker Data API</h1>
<p>Free fake REST data for coding, prototyping and demos — ${resources.length} resources across ${topics.length} topics.
<a href="/docs">Interactive docs (Swagger)</a> · <a href="/api/resources">/api/resources</a> · <a href="/api/datasets">SQL datasets</a></p>
<pre>fetch('<span id="origin"></span>/api/users/1').then(r =&gt; r.json()).then(console.log)

GET /api/products?page=2&amp;limit=20        paginated list
GET /api/users/1/posts                  nested resources
GET /api/users/random?count=5           random items
GET /api/products/export?count=1000&amp;format=csv   bulk export (json | csv | sql)
GET /api/users?locale=vi&amp;seed=42         localized, reproducible data
GET /api/generate?count=5&amp;name=person.fullName&amp;email=internet.email   custom schema
POST|PUT|PATCH|DELETE /api/posts/1      simulated writes (nothing is stored)</pre>
<p>Data is deterministic: the same id, <code>seed</code> and <code>locale</code> always return the same entity.</p>
${sections}
</main><script>document.getElementById('origin').textContent=location.origin</script></body></html>`;
  }
}
