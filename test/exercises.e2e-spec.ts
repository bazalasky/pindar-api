import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, seedUserWithExercise } from './helpers';
import { resetDb } from './reset-db';

describe('Exercise (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  it('/exercises (GET) return only callers exercises', async () => {
    const { exercise: exercise1, token: token1 } = await seedUserWithExercise(
      prisma,
      app,
      'test1@example.com',
    );
    await seedUserWithExercise(prisma, app, 'test2@example.com');

    const res = await request(app.getHttpServer())
      .get('/exercises')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(exercise1.id);
  });

  it('/exercises (POST) duplicate creates no row', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Bench Press',
      })
      .expect(409);

    expect(await prisma.exercise.count()).toBe(1);
  });

  it('/exercises (POST) empty creates no row', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '    ',
      })
      .expect(400);

    expect(await prisma.exercise.count()).toBe(1);
  });

  it('/exercises (POST) create new exercise', async () => {
    const { user, token } = await seedUserWithExercise(prisma, app);

    const res = await request(app.getHttpServer())
      .post('/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Squat',
      })
      .expect(201);

    expect(await prisma.exercise.count()).toBe(2);
    expect(res.body.userId).toBe(user.id);
  });

  it('/exercises (POST) userId in body creates no row', async () => {
    const { user, token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: user.id,
        name: 'Squat',
      })
      .expect(400);

    expect(await prisma.exercise.count()).toBe(1);
  });

  it('/exercises (GET) 401 with no token', async () => {
    await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer()).get('/exercises').expect(401);
  });

  it('/exercises (POST) 401 with no token', async () => {
    await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/exercises')
      .send({
        name: 'Squat',
      })
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
