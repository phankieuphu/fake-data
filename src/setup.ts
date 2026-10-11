import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { fileURLToPath } from 'node:url';

// public/ sits next to src/ and dist/, so this resolves from either.
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));

/** Shared by main.ts and the e2e tests so both run the same app config. */
export function configureApp(
  app: NestExpressApplication,
): NestExpressApplication {
  app.enableCors();
  app.set('json spaces', 2);
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.useStaticAssets(PUBLIC_DIR, { maxAge: '1h' });

  const config = new DocumentBuilder()
    .setTitle('Faker Data API')
    .setDescription(
      'Free, deterministic fake data for coding, prototyping and demos. ' +
        'Every list supports page, limit, seed, locale, fields and format (json | csv | sql).',
    )
    .setVersion('2.0.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, config),
    {
      jsonDocumentUrl: 'openapi.json',
      customSiteTitle: 'Faker Data API reference',
    },
  );

  return app;
}
