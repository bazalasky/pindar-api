import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Read email/password (and name) from process.env — throw a clear
  //    error early if either is missing, so you don't silently create
  //    a broken user.
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const name = process.env.NAME;

  if (!email || !password || !name) {
    throw new Error("Email, password, and name are required");
  }

  // 2. Hash the password: await bcrypt.hash(password, saltRounds)
  //    saltRounds is the "cost factor" from the slow-hash concept —
  //    higher = slower/more brute-force-resistant, but slower for you
  //    too on every real login. 10–12 is the standard range.
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 3. Instantiate PrismaClient, call prisma.user.create({ data: {...} })
  //    with the hashed password — never the raw one.
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });
  // 4. Log a success message that confirms the user was created
  //    (e.g. the email) — do NOT log the password or hash.
    console.log(`User created successfully: ${email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
  });
