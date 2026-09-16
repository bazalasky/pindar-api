import { PrismaClient } from '../generated/prisma/client';

export async function resetDb(prisma: PrismaClient) {
  // 1. Guard: refuse to run against anything that isn't local.
  const host = new URL(process.env.DATABASE_URL ?? '').hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error(`resetDb refused to run: DATABASE_URL host is "${host}"`);
  }

  const tablenames = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`;

  if (tablenames.length === 0) {
    throw new Error(`resetDb found no tables to truncate`);
  }

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
  );
}
