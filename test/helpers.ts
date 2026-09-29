import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Builds and initialises a Nest app from AppModule, returning it alongside the
 * PrismaService instance from the same DI container. Specs keep their own
 * `app`/`prisma` variables and assign from this in `beforeAll`.
 */
export async function createTestApp(): Promise<{
  app: INestApplication<App>;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  await app.init();
  const prisma = app.get(PrismaService);

  return { app, prisma };
}

/**
 * Creates a user, one exercise owned by them, and a signed token for them.
 * `prisma` and `app` are parameters rather than closure variables because this
 * lives outside the `describe` that declares them.
 */
export async function seedUserWithExercise(
  prisma: PrismaService,
  app: INestApplication,
  email = 'test@example.com',
) {
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
