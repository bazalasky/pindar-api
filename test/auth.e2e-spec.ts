import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { resetDb } from './reset-db';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await resetDb(app.get(PrismaService));
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.invalid', password: 'wrong' })
      .expect(401);
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(400);
  });

  describe('test harness', () => {
    let prisma: PrismaService;

    beforeAll(() => {
      prisma = app.get(PrismaService);
    });

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
