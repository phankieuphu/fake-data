import { Injectable } from '@nestjs/common';
import { RESOURCE_DEFINITIONS } from './definitions/index.js';
import type { ResourceDefinition } from './resource.types.js';

/** Path segments under /api owned by other controllers. */
export const RESERVED_NAMES = [
  'resources',
  'generate',
  'datasets',
  'health',
  'locales',
];

export interface ResourceInfo {
  name: string;
  topic: string;
  description: string;
  total: number;
  endpoint: string;
  parent?: {
    resource: string;
    key: string;
    perParent: number;
    endpoint: string;
  };
  children: string[];
}

@Injectable()
export class ResourceRegistry {
  private readonly definitions = new Map<string, ResourceDefinition>();
  private readonly totals = new Map<string, number>();

  constructor() {
    for (const def of RESOURCE_DEFINITIONS) this.register(def);
  }

  private register(def: ResourceDefinition): void {
    if (RESERVED_NAMES.includes(def.name)) {
      throw new Error(`Resource name "${def.name}" is reserved`);
    }
    if (this.definitions.has(def.name)) {
      throw new Error(`Duplicate resource "${def.name}"`);
    }
    if (!def.parent === !def.total) {
      throw new Error(
        `Resource "${def.name}" needs exactly one of total / parent`,
      );
    }
    this.definitions.set(def.name, def);
  }

  names(): string[] {
    return [...this.definitions.keys()];
  }

  find(name: string): ResourceDefinition | undefined {
    return this.definitions.get(name);
  }

  total(name: string): number {
    let total = this.totals.get(name);
    if (total === undefined) {
      const def = this.definitions.get(name);
      if (!def) throw new Error(`Unknown resource "${name}"`);
      total = def.parent
        ? this.total(def.parent.resource) * def.parent.perParent
        : def.total!;
      this.totals.set(name, total);
    }
    return total;
  }

  childrenOf(name: string): ResourceDefinition[] {
    return [...this.definitions.values()].filter(
      (def) => def.parent?.resource === name,
    );
  }

  info(def: ResourceDefinition): ResourceInfo {
    return {
      name: def.name,
      topic: def.topic,
      description: def.description,
      total: this.total(def.name),
      endpoint: `/api/${def.name}`,
      parent: def.parent && {
        ...def.parent,
        endpoint: `/api/${def.parent.resource}/:id/${def.name}`,
      },
      children: this.childrenOf(def.name).map((child) => child.name),
    };
  }

  catalog(): ResourceInfo[] {
    return [...this.definitions.values()].map((def) => this.info(def));
  }
}
