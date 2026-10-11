import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Shared by main.ts and the e2e tests so both run the same app config. */
export function configureApp(
  app: NestExpressApplication,
): NestExpressApplication {
  app.enableCors();
  app.set('json spaces', 2);
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  const config = new DocumentBuilder()
    .setTitle('Faker Data API')
    .setDescription(
      'Free, deterministic fake data for coding, prototyping and demos. ' +
        'Every list supports page, limit, seed, locale, fields and format (json | csv | sql).',
    )
    .setVersion('2.0.0')
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );

  return app;
}
