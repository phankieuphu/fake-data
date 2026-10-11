import { Injectable, NotFoundException } from '@nestjs/common';
import { createFaker } from '../common/faker.factory.js';
import type { GenerateOptions } from '../common/query.js';
import { ResourceRegistry } from './resource.registry.js';
import type { Entity, ResourceDefinition } from './resource.types.js';

export interface Page<T> {
  data: T[];
  meta: {
    resource: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ResourcesService {
  constructor(private readonly registry: ResourceRegistry) {}

  definition(name: string): ResourceDefinition {
    const def = this.registry.find(name);
    if (!def) {
      throw new NotFoundException(
        `Unknown resource "${name}". See GET /api/resources for the list.`,
      );
    }
    return def;
  }

  /** Builds entity `id` of `name`. Same (name, id, seed, locale) ⇒ same output. */
  build(name: string, id: number, opts: GenerateOptions): Entity {
    const def = this.definition(name);
    const total = this.registry.total(name);
    if (!Number.isInteger(id) || id < 1 || id > total) {
      throw new NotFoundException(
        `${name} #${id} not found (valid ids: 1..${total})`,
      );
    }

    const faker = createFaker(`${opts.seed}:${name}:${id}`, opts.locale);
    const parentId = def.parent ? Math.ceil(id / def.parent.perParent) : 0;
    const generated = def.generate({
      faker,
      id,
      parentId,
      ref: (resource) =>
        faker.number.int({ min: 1, max: this.registry.total(resource) }),
      lookup: (resource, refId) => this.build(resource, refId, opts),
    });

    return def.parent
      ? { id, [def.parent.key]: parentId, ...generated }
      : { id, ...generated };
  }

  get(name: string, id: number, opts: GenerateOptions): Entity {
    return project(this.build(name, id, opts), opts.fields);
  }

  list(name: string, opts: GenerateOptions): Page<Entity> {
    this.definition(name);
    return this.paginate(name, 1, this.registry.total(name), opts);
  }

  /** e.g. GET /api/users/3/posts */
  listChildren(
    parentName: string,
    parentId: number,
    childName: string,
    opts: GenerateOptions,
  ): Page<Entity> {
    const child = this.definition(childName);
    if (child.parent?.resource !== parentName) {
      const nested = this.registry
        .childrenOf(parentName)
        .map((def) => def.name);
      throw new NotFoundException(
        `"${childName}" is not nested under "${parentName}"` +
          (nested.length ? ` (available: ${nested.join(', ')})` : ''),
      );
    }
    this.build(parentName, parentId, opts); // 404s for an out-of-range parent
    const per = child.parent.perParent;
    const first = (parentId - 1) * per + 1;
    return this.paginate(childName, first, first + per - 1, opts);
  }

  random(name: string, count: number, opts: GenerateOptions): Entity[] {
    this.definition(name);
    const total = this.registry.total(name);
    const picker = createFaker(`${opts.seed}:${name}:random:${Math.random()}`);
    const ids = picker.helpers.uniqueArray(
      () => picker.number.int({ min: 1, max: total }),
      Math.min(count, total),
    );
    return ids.map((id) => this.get(name, id, opts));
  }

  // Write endpoints are simulated (nothing is persisted), JSONPlaceholder-style:
  // they validate the target and echo back what a real API would return.

  create(name: string, body: Record<string, unknown>): Entity {
    this.definition(name);
    const now = new Date().toISOString();
    return {
      ...body,
      id: this.registry.total(name) + 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  replace(
    name: string,
    id: number,
    body: Record<string, unknown>,
    opts: GenerateOptions,
  ): Entity {
    this.build(name, id, opts);
    return { ...body, id, updatedAt: new Date().toISOString() };
  }

  update(
    name: string,
    id: number,
    body: Record<string, unknown>,
    opts: GenerateOptions,
  ): Entity {
    const existing = this.build(name, id, opts);
    return { ...existing, ...body, id, updatedAt: new Date().toISOString() };
  }

  remove(
    name: string,
    id: number,
    opts: GenerateOptions,
  ): { id: number; deleted: true; deletedAt: string } {
    this.build(name, id, opts);
    return { id, deleted: true, deletedAt: new Date().toISOString() };
  }

  private paginate(
    name: string,
    firstId: number,
    lastId: number,
    opts: GenerateOptions,
  ): Page<Entity> {
    const total = lastId - firstId + 1;
    const { page, limit } = opts;
    const start = firstId + (page - 1) * limit;
    const end = Math.min(start + limit - 1, lastId);
    const data: Entity[] = [];
    for (let id = start; id <= end; id++) data.push(this.get(name, id, opts));
    return {
      data,
      meta: {
        resource: name,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

function project(entity: Entity, fields?: string[]): Entity {
  if (!fields?.length) return entity;
  const picked: Entity = { id: entity.id };
  for (const field of fields)
    if (field in entity) picked[field] = entity[field];
  return picked;
}
