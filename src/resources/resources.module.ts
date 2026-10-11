import { Module } from '@nestjs/common';
import { ResourceRegistry } from './resource.registry.js';
import { ResourcesController } from './resources.controller.js';
import { ResourcesService } from './resources.service.js';

@Module({
  controllers: [ResourcesController],
  providers: [ResourceRegistry, ResourcesService],
  exports: [ResourceRegistry, ResourcesService],
})
export class ResourcesModule {}
