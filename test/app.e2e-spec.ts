import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/setup.js';

describe('Faker Data API (e2e)', () => {
  let app: NestExpressApplication;
  let http: App;

  beforeAll(async () => {
    process.env.RATE_LIMIT = '10000';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      moduleFixture.createNestApplication<NestExpressApplication>(),
    );
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the server-rendered docs site', async () => {
    const home = await request(http)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);
    expect(home.text).toContain('<h1>Fake data REST API');
    expect(home.text).toContain('"@type":"FAQPage"');
    expect(home.text).toContain('href="/resources/users"');

    const page = await request(http).get('/resources/products').expect(200);
    expect(page.text).toContain('Fake products API');
    expect(page.text).toContain('&quot;title&quot;'); // example JSON rendered server-side

    await request(http).get('/resources').expect(200);
    await request(http)
      .get('/resources/nope')
      .expect(404)
      .expect('Content-Type', /html/);
    await request(http).get('/assets/app.js').expect(200);
    await request(http).get('/assets/styles.css').expect(200);
    await request(http).get('/docs').expect(200);
    await request(http)
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('ok'));
  });

  it('serves AI / search discovery files', async () => {
    const llms = await request(http)
      .get('/llms.txt')
      .expect(200)
      .expect('Content-Type', /text\/plain/);
    expect(llms.text).toMatch(/^# Faker Data API/);
    expect(llms.text).toContain('/api/users');

    const full = await request(http).get('/llms-full.txt').expect(200);
    expect(full.text).toContain('## vehicles');

    const robots = await request(http).get('/robots.txt').expect(200);
    expect(robots.text).toContain('User-agent: GPTBot');
    expect(robots.text).toMatch(/Sitemap: http:\/\/.+\/sitemap\.xml/);

    const sitemap = await request(http).get('/sitemap.xml').expect(200);
    expect(sitemap.text).toContain('/resources/orders</loc>');

    const openapi = await request(http).get('/openapi.json').expect(200);
    expect(openapi.body.paths['/api/{resource}']).toBeDefined();
  });

  it('GET /api/resources lists topics', async () => {
    const { body } = await request(http).get('/api/resources').expect(200);
    expect(body.count).toBeGreaterThan(30);
    expect(body.topics.map((t: { topic: string }) => t.topic)).toContain(
      'e-commerce',
    );
  });

  it('lists, gets and nests resources', async () => {
    const list = await request(http)
      .get('/api/users?limit=5&page=2')
      .expect(200);
    expect(list.body.data.map((u: { id: number }) => u.id)).toEqual([
      6, 7, 8, 9, 10,
    ]);

    const user = await request(http).get('/api/users/6').expect(200);
    expect(user.body).toEqual(list.body.data[0]);

    const posts = await request(http)
      .get('/api/users/6/posts?limit=3')
      .expect(200);
    expect(posts.body.data[0]).toMatchObject({ id: 51, userId: 6 });
    expect(posts.body.meta.total).toBe(10);
  });

  it('returns random items', async () => {
    const { body } = await request(http)
      .get('/api/products/random?count=3')
      .expect(200);
    expect(body).toHaveLength(3);
  });

  it('exports CSV and SQL', async () => {
    const csv = await request(http)
      .get('/api/todos/export?count=3&format=csv')
      .expect(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.headers['content-disposition']).toMatch(/todos\.csv/);
    expect(csv.text.trim().split('\n')).toHaveLength(4);

    const sql = await request(http)
      .get('/api/users?limit=2&format=sql&fields=email')
      .expect(200);
    expect(sql.text).toMatch(/^INSERT INTO users \(id, email\) VALUES/);
  });

  it('simulates writes', async () => {
    const created = await request(http)
      .post('/api/posts')
      .send({ title: 'Hi' })
      .expect(201);
    expect(created.body).toMatchObject({ id: 10001, title: 'Hi' });

    const patched = await request(http)
      .patch('/api/posts/1')
      .send({ title: 'New' })
      .expect(200);
    expect(patched.body).toMatchObject({ id: 1, userId: 1, title: 'New' });

    await request(http)
      .delete('/api/posts/1')
      .expect(200)
      .expect(({ body }) => expect(body.deleted).toBe(true));
  });

  it('generates custom schemas via GET and POST', async () => {
    const get = await request(http)
      .get('/api/generate?count=2&name=person.fullName&ip=internet.ipv4')
      .expect(200);
    expect(get.body).toHaveLength(2);
    expect(Object.keys(get.body[0])).toEqual(['id', 'name', 'ip']);

    const post = await request(http)
      .post('/api/generate')
      .send({ count: 1, schema: { user: { email: 'internet.email' } } })
      .expect(200);
    expect(post.body[0].user.email).toContain('@');

    await request(http).get('/api/generate?x=helpers.arrayElement').expect(400);
    await request(http).get('/api/generate/methods').expect(200);
  });

  it('serves SQL datasets', async () => {
    const { text } = await request(http)
      .get('/api/datasets/customer.sql')
      .expect(200);
    expect(text).toContain('CREATE TABLE customer');
    expect(text).toContain('INSERT INTO customer');
  });

  it('validates input', async () => {
    await request(http).get('/api/nope').expect(404);
    await request(http).get('/api/users/0').expect(404);
    await request(http).get('/api/users/abc').expect(400);
    await request(http).get('/api/users?limit=1000').expect(400);
    await request(http).get('/api/users?locale=xx').expect(400);
  });
});
