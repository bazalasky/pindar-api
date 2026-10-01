import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers';
import { resetDb } from './reset-db';
import bcrypt from 'bcrypt';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  it('rejects an unknown user with 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.invalid', password: 'wrong' })
      .expect(401);
  });

  it('rejects an empty body with 400', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(400);
  });

  it('can login with valid credentials', async () => {
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@test.com',
          password: await bcrypt.hash('somepassword', 10),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'somepassword' })
        .expect(200)

      expect(res.body.access_token).toMatch(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/);
    });

  describe('test harness', () => {
    it('starts each test with an empty database', async () => {
      expect(await prisma.user.count()).toBe(0);
    });

    it('sees a row it just created', async () => {
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123',
        },
      });
      expect(await prisma.user.count()).toBe(1);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
