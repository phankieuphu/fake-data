import { Controller, Get, Header, Param, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { parseOptions } from '../common/query.js';
import { ResourceRegistry } from '../resources/resource.registry.js';
import { ResourcesService } from '../resources/resources.service.js';
import type { SiteUrls } from './html.js';
import { llmsFullTxt, llmsTxt, robotsTxt, sitemapXml } from './discovery.js';
import {
  homePage,
  notFoundPage,
  resourcePage,
  resourcesIndexPage,
} from './pages.js';

const HTML = 'text/html; charset=utf-8';
const TEXT = 'text/plain; charset=utf-8';
const CACHE = 'public, max-age=300';

const trim = (url?: string) => url?.trim().replace(/\/+$/, '') || undefined;

/**
 * PUBLIC_URL: this API's public origin (defaults to the request host).
 * SITE_URL: where the docs site is canonically hosted, e.g. the Vercel
 * deployment — set it so this copy of the pages points search engines there.
 */
function siteUrls(req: Request): SiteUrls {
  const api =
    trim(process.env.PUBLIC_URL) ?? `${req.protocol}://${req.get('host')}`;
  return { api, site: trim(process.env.SITE_URL) ?? api };
}

@ApiExcludeController()
@SkipThrottle()
@Controller()
export class SiteController {
  private readonly defaults = parseOptions({});

  constructor(
    private readonly registry: ResourceRegistry,
    private readonly resources: ResourcesService,
  ) {}

  @Get()
  @Header('Content-Type', HTML)
  @Header('Cache-Control', CACHE)
  home(@Req() req: Request): string {
    const sample = this.resources.list('users', { ...this.defaults, limit: 3 });
    return homePage(siteUrls(req), this.registry.catalog(), sample);
  }

  @Get('resources')
  @Header('Content-Type', HTML)
  @Header('Cache-Control', CACHE)
  resourcesIndex(@Req() req: Request): string {
    return resourcesIndexPage(siteUrls(req), this.registry.catalog());
  }

  @Get('resources/:name')
  @Header('Cache-Control', CACHE)
  resource(
    @Param('name') name: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): string {
    res.type('html');
    const def = this.registry.find(name);
    if (!def) {
      res.status(404);
      return notFoundPage(siteUrls(req), name);
    }
    return resourcePage(
      siteUrls(req),
      this.registry.info(def),
      this.resources.get(name, 1, this.defaults),
      this.resources.list(name, { ...this.defaults, limit: 3 }),
    );
  }

  @Get('robots.txt')
  @Header('Content-Type', TEXT)
  robots(@Req() req: Request): string {
    return robotsTxt(siteUrls(req).site);
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  sitemap(@Req() req: Request): string {
    return sitemapXml(siteUrls(req), this.registry.catalog());
  }

  @Get('llms.txt')
  @Header('Content-Type', TEXT)
  @Header('Cache-Control', CACHE)
  llms(@Req() req: Request): string {
    return llmsTxt(siteUrls(req), this.registry.catalog());
  }

  @Get('llms-full.txt')
  @Header('Content-Type', TEXT)
  @Header('Cache-Control', CACHE)
  llmsFull(@Req() req: Request): string {
    return llmsFullTxt(siteUrls(req), this.registry.catalog(), (name) =>
      this.resources.get(name, 1, this.defaults),
    );
  }
}
