import { NotFoundException } from '@nestjs/common';
import { parseOptions } from '../common/query.js';
import { ResourceRegistry } from './resource.registry.js';
import { ResourcesService } from './resources.service.js';

describe('ResourcesService', () => {
  const registry = new ResourceRegistry();
  const service = new ResourcesService(registry);
  const opts = parseOptions({});

  it.each(registry.names())(
    '%s generates valid entities (first, last, other locale)',
    (name) => {
      const total = registry.total(name);
      for (const id of [1, total]) {
        const entity = service.get(name, id, opts);
        expect(entity.id).toBe(id);
        expect(Object.keys(entity).length).toBeGreaterThan(1);
      }
      expect(service.get(name, 1, parseOptions({ locale: 'ja' })).id).toBe(1);
    },
  );

  it('is deterministic per id + seed and varies with seed', () => {
    const a = service.get('users', 7, opts);
    expect(service.get('users', 7, opts)).toEqual(a);
    expect(service.get('users', 7, parseOptions({ seed: '2' }))).not.toEqual(a);
  });

  it('lays nested resources out contiguously under their parent', () => {
    const page = service.listChildren(
      'users',
      3,
      'posts',
      parseOptions({ limit: '100' }),
    );
    expect(page.meta.total).toBe(10);
    expect(page.data.map((p) => p.id)).toEqual([
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    ]);
    expect(page.data.every((p) => p.userId === 3)).toBe(true);
    expect(service.get('posts', 25, opts)).toEqual(page.data[4]);
  });

  it('paginates and reports totals', () => {
    const page = service.list(
      'products',
      parseOptions({ page: '3', limit: '20' }),
    );
    expect(page.data[0].id).toBe(41);
    expect(page.data).toHaveLength(20);
    expect(page.meta).toMatchObject({ total: 1000, totalPages: 50 });
  });

  it('references real entities in lookups', () => {
    const cart = service.get('carts', 1, opts) as {
      items: { productId: number; title: string }[];
    };
    for (const item of cart.items) {
      expect(item.title).toBe(
        service.get('products', item.productId, opts).title,
      );
    }
  });

  it('projects fields', () => {
    expect(
      service.get('users', 1, parseOptions({ fields: 'email,nope' })),
    ).toEqual({
      id: 1,
      email: expect.any(String),
    });
  });

  it('throws 404 for unknown resources and out-of-range ids', () => {
    expect(() => service.get('nope', 1, opts)).toThrow(NotFoundException);
    expect(() => service.get('users', 0, opts)).toThrow(NotFoundException);
    expect(() => service.get('users', 1001, opts)).toThrow(NotFoundException);
    expect(() => service.listChildren('users', 1, 'comments', opts)).toThrow(
      NotFoundException,
    );
  });
});
