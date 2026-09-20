import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { App } from 'supertest/types';
import { resetDb } from './reset-db';
import { PrismaService } from '../src/prisma/prisma.service';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

describe('Activities (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  async function seedUserWithExercise(email = 'test@example.com') {
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: email,
        password: 'password123',
      },
    });

    const exercise = await prisma.exercise.create({
      data: { name: 'Bench Press', userId: user.id },
    });

    const token = app.get(JwtService).sign({ sub: user.id });

    return { user, exercise, token };
  }

  it('/activities (POST)', async () => {
    const { exercise, token } = await seedUserWithExercise();

    await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(201);

    expect(await prisma.activity.count()).toBe(1);
    expect(await prisma.liftActivity.count()).toBe(1);
    expect(await prisma.set.count()).toBe(1);
  });

  it('/activities (POST) with missing auth', async () => {
    const { exercise } = await seedUserWithExercise();

    await request(app.getHttpServer())
      .post('/activities')
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(401);
  });

  it('activities (GET) create activity', async () => {
    const { exercise, token } = await seedUserWithExercise();

    const res = await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/activities')
      .expect(200);
    expect(listRes.body).toHaveLength(1);

    const oneRes = await request(app.getHttpServer())
      .get(`/activities/${res.body.id}`)
      .expect(200);
    expect(oneRes.body.id).toBe(res.body.id);
  });

  it('/activities (GET) invalid id', async () => {
    await request(app.getHttpServer()).get('/activities/999999').expect(404);
  });

  it('/activities (POST) with invalid userId', async () => {
    const { exercise, token } = await seedUserWithExercise();

    await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
        userId: 999,
      })
      .expect(400);
  });

  it('/activities (POST) with invalid data', async () => {
    const { exercise, token } = await seedUserWithExercise();

    await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 'abc',
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(400);
  });

  it('/activities (POST) another users exercise is rejected', async () => {
    const { token: token1 } = await seedUserWithExercise('test1@example.com');
    const { exercise: exercise2 } =
      await seedUserWithExercise('test2@example.com');

    await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise2.id,
            setNumber: 1,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(400);

    expect(await prisma.activity.count()).toBe(0);
    expect(await prisma.liftActivity.count()).toBe(0);
    expect(await prisma.set.count()).toBe(0);
  });

  it('/activities (POST) rejected request persists no data', async () => {
    const { exercise, token } = await seedUserWithExercise();

    await request(app.getHttpServer())
      .post('/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 10,
            weight: '225.5',
            rpe: '8.5',
          },
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 10,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(400);

    expect(await prisma.activity.count()).toBe(0);
    expect(await prisma.liftActivity.count()).toBe(0);
    expect(await prisma.set.count()).toBe(0);
  });

  afterAll(async () => {
    await app.close();
  });
});
