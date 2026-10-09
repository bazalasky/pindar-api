import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { resetDb } from './reset-db';
import { PrismaService } from '../src/prisma/prisma.service';
import request from 'supertest';
import { createTestApp, seedUserWithExercise } from './helpers';

describe('Activities (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  async function postLift(exercise: { id: number }, token: string) {
    return await request(app.getHttpServer())
      .post('/activities/lift')
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
          {
            exerciseId: exercise.id,
            setNumber: 2,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(201);
  }

  it('/activities/lift (POST)', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/activities/lift')
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

  it('/activities/run (POST)', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    const res = await request(app.getHttpServer())
      .post('/activities/run')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 1800,
        notes: 'felt good',
        bodyweight: '180.5',
        distance: '3.1',
        elevation: 100,
        heartRate: 150,
      })
      .expect(201);

    expect(await prisma.activity.count()).toBe(1);
    expect(await prisma.runActivity.count()).toBe(1);
    expect(await prisma.liftActivity.count()).toBe(0);
    expect(res.body.activityType).toBe('Run');
  });

  it('/activities/run /activities/lift (POST) create both', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/activities/lift')
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

    await request(app.getHttpServer())
      .post('/activities/run')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 1800,
        notes: 'felt good',
        bodyweight: '180.5',
        distance: '3.1',
        elevation: 100,
        heartRate: 150,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/activities')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveLength(2);

    const lift = res.body.find((a) => a.activityType === 'Lift');
    const run = res.body.find((a) => a.activityType === 'Run');

    expect(lift.liftActivity).not.toBeNull();
    expect(lift.runActivity).toBeNull();
    expect(run.runActivity).not.toBeNull();
    expect(run.liftActivity).toBeNull();
  });

  it('/activities/run (POST) with empty optionals', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    const res = await request(app.getHttpServer())
      .post('/activities/run')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 1800,
        notes: 'felt good',
        bodyweight: '180.5',
      })
      .expect(201);

    expect(res.body.runActivity.distance).toBe(null);
    expect(res.body.runActivity.elevation).toBe(0);
    expect(res.body.runActivity.heartRate).toBe(null);
  });

  it('/activities/lift (POST) with missing auth', async () => {
    const { exercise } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/activities/lift')
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

  it('/activities/run (POST) with missing auth', async () => {
    await request(app.getHttpServer())
      .post('/activities/run')
      .send({
        date: '2026-09-18',
        durationSeconds: 1800,
        notes: 'felt good',
        bodyweight: '180.5',
      })
      .expect(401);
  });

  it('/activities/run (POST) invalid field', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/activities/run')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 1800,
        notes: 'felt good',
        bodyweight: '180.5',
        distance: '3.1',
        elevation: 0,
        heartRate: 'abc',
      })
      .expect(400);
  });

  it('/activities (GET) with missing auth', async () => {
    await request(app.getHttpServer()).get('/activities').expect(401);
  });

  it('/activities/:id (GET) with missing auth', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    const res = await request(app.getHttpServer())
      .post('/activities/run')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 1800,
        notes: 'felt good',
        bodyweight: '180.5',
      })
      .expect(201);

    await request(app.getHttpServer()).get(`/activities/${res.body.id}`).expect(401);
  });

  it('/activities (GET) create activity', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    const res = await request(app.getHttpServer())
      .post('/activities/lift')
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
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listRes.body).toHaveLength(1);

    const oneRes = await request(app.getHttpServer())
      .get(`/activities/${res.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(oneRes.body.id).toBe(res.body.id);
  });

  it('/activities (GET) invalid id', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .get('/activities/999999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('/activities (GET) only users own activities are returned', async () => {
    const {
      user: user1,
      exercise: exercise1,
      token: token1,
    } = await seedUserWithExercise(prisma, app, 'test1@example.com');
    const {
      user: user2,
      exercise: exercise2,
      token: token2,
    } = await seedUserWithExercise(prisma, app, 'test2@example.com');

    const res1 = await request(app.getHttpServer())
      .post('/activities/lift')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise1.id,
            setNumber: 1,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(201);

    const res2 = await request(app.getHttpServer())
      .post('/activities/lift')
      .set('Authorization', `Bearer ${token2}`)
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
      .expect(201);

    const listRes1 = await request(app.getHttpServer())
      .get(`/activities`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);
    expect(listRes1.body).toHaveLength(1);
    expect(listRes1.body[0].id).toBe(res1.body.id);

    const listRes2 = await request(app.getHttpServer())
      .get(`/activities`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);
    expect(listRes2.body).toHaveLength(1);
    expect(listRes2.body[0].id).toBe(res2.body.id);
  });

  it('/activities (GET) another users activities are not returned', async () => {
    const {
      user: user1,
      exercise: exercise1,
      token: token1,
    } = await seedUserWithExercise(prisma, app, 'test1@example.com');
    const { token: token2 } = await seedUserWithExercise(
      prisma,
      app,
      'test2@example.com',
    );

    const res = await request(app.getHttpServer())
      .post('/activities/lift')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 3600,
        notes: 'felt good',
        bodyweight: '180.5',
        sets: [
          {
            exerciseId: exercise1.id,
            setNumber: 1,
            reps: 5,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(201);

    const listRes2 = await request(app.getHttpServer())
      .get(`/activities/${res.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);
    expect(listRes2.body.id).toBeUndefined();
  });

  it('/activities/lift (POST) with invalid userId', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/activities/lift')
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

  it('/activities/lift (POST) with invalid data', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/activities/lift')
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

  it('/activities/lift (POST) another users exercise is rejected', async () => {
    const { token: token1 } = await seedUserWithExercise(
      prisma,
      app,
      'test1@example.com',
    );
    const { exercise: exercise2 } = await seedUserWithExercise(
      prisma,
      app,
      'test2@example.com',
    );

    await request(app.getHttpServer())
      .post('/activities/lift')
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

  it('/activities/lift (POST) rejected request persists no data', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    await request(app.getHttpServer())
      .post('/activities/lift')
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

  it('activities/lift (PATCH) omitting sets leaves them intact', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    const lift = await postLift(exercise, token);

    const res = await request(app.getHttpServer())
      .patch(`/activities/lift/${lift.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'updating lift',
      })
      .expect(200);

    expect(await prisma.set.count()).toBe(2);
    expect(res.body.notes).toBe('updating lift');
  });

  it('activities/lift (PATCH) including sets replaces them', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    const lift = await postLift(exercise, token);

    const res = await request(app.getHttpServer())
      .patch(`/activities/lift/${lift.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'updating lift',
        sets: [
          {
            exerciseId: exercise.id,
            setNumber: 1,
            reps: 10,
            weight: '225.5',
            rpe: '8.5',
          },
        ],
      })
      .expect(200);

    expect(await prisma.set.count()).toBe(1);
    expect(res.body.notes).toBe('updating lift');
  });

  it('activities/lift (PATCH) editing another users activity returns 404', async () => {
    const { exercise: exercise1, token: token1 } = await seedUserWithExercise(
      prisma,
      app,
      'test1@example.com',
    );
    const { token: token2 } = await seedUserWithExercise(
      prisma,
      app,
      'test2@example.com',
    );

    const lift = await postLift(exercise1, token1);

    const res = await request(app.getHttpServer())
      .patch(`/activities/lift/${lift.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({
        notes: 'updating lift',
      })
      .expect(404);

    const oneRes = await request(app.getHttpServer())
      .get(`/activities/${lift.body.id}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(await oneRes.body.notes).toBe('felt good');
  });

  it('activities/lift (PATCH) editing run id on lift route returns 404', async () => {
    const { token } = await seedUserWithExercise(prisma, app);

    const run = await request(app.getHttpServer())
      .post('/activities/run')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-09-18',
        durationSeconds: 1800,
        notes: 'felt good',
        bodyweight: '180.5',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/activities/lift/${run.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'updating lift',
      })
      .expect(404);
  });

  it('activities/id (DELETE) delete activity', async () => {
    const { exercise, token } = await seedUserWithExercise(prisma, app);

    const lift = await postLift(exercise, token);

    await request(app.getHttpServer())
      .delete(`/activities/${lift.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await prisma.activity.count()).toBe(0);
    expect(await prisma.liftActivity.count()).toBe(0);
    expect(await prisma.set.count()).toBe(0);
  });

  it('activities/id (DELETE) delete another users activity', async () => {
    const { exercise: exercise1, token: token1 } = await seedUserWithExercise(
      prisma,
      app,
      'test1@example.com',
    );
    const { token: token2 } = await seedUserWithExercise(
      prisma,
      app,
      'test2@example.com',
    );

    const lift = await postLift(exercise1, token1);

    await request(app.getHttpServer())
      .delete(`/activities/${lift.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);

    expect(await prisma.activity.count()).toBe(1);
  });

  afterAll(async () => {
    await app.close();
  });
});
