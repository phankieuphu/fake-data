import type { Faker } from '@faker-js/faker';

export type Entity = { id: number } & Record<string, unknown>;

export interface GenerateContext {
  faker: Faker;
  id: number;
  /** Id of the owning parent entity, for resources declared with `parent`. */
  parentId: number;
  /** Picks a valid id of another resource (deterministic per entity). */
  ref: (resource: string) => number;
  /** Generates another resource's entity by id (e.g. product inside a cart). */
  lookup: (resource: string, id: number) => Entity;
}

export interface ResourceDefinition {
  /** URL segment, plural kebab-case: `/api/<name>`. */
  name: string;
  topic: string;
  description: string;
  /** Number of entities for top-level resources. */
  total?: number;
  /**
   * Nested resources: each parent owns exactly `perParent` children, laid out
   * contiguously (like JSONPlaceholder), so `/api/users/3/posts` is O(1).
   */
  parent?: { resource: string; perParent: number; key: string };
  generate(ctx: GenerateContext): Record<string, unknown>;
}
