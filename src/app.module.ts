import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatasetsModule } from './datasets/datasets.module.js';
import { GeneratorModule } from './generator/generator.module.js';
import { HomeController } from './home/home.controller.js';
import { ResourcesModule } from './resources/resources.module.js';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60_000),
          limit: Number(process.env.RATE_LIMIT ?? 120),
        },
      ],
    }),
    // Order matters: the static /api/generate and /api/datasets routes must be
    // registered before ResourcesModule's catch-all /api/:resource routes.
    GeneratorModule,
    DatasetsModule,
    ResourcesModule,
  ],
  controllers: [HomeController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
