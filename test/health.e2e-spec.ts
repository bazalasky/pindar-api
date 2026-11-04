import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

describe('Health success (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});

describe('Health database fails (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: jest
          .fn()
          .mockRejectedValue(new Error('Database connection failed')),
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/health database fails (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(503).expect({
      statusCode: 503,
      message: 'Database connection failed',
      error: 'Service Unavailable',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
