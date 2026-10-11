import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './setup.js';

async function bootstrap() {
  const app = configureApp(
    await NestFactory.create<NestExpressApplication>(AppModule),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `Faker Data API listening on http://localhost:${port} (docs: /docs)`,
  );
}
await bootstrap();
