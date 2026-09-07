-- CreateEnum
CREATE TYPE "Type" AS ENUM ('Lift', 'Run');

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "activityType" "Type" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "duration" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "bodyweight" DECIMAL(65,30) NOT NULL,
    "userId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftActivity" (
    "activityId" INTEGER NOT NULL,

    CONSTRAINT "LiftActivity_pkey" PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "RunActivity" (
    "activityId" INTEGER NOT NULL,
    "distance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pace" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "elevation" INTEGER NOT NULL DEFAULT 0,
    "heartRate" INTEGER,

    CONSTRAINT "RunActivity_pkey" PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Set" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "liftActivityId" INTEGER NOT NULL,
    "weight" DECIMAL(65,30),
    "reps" INTEGER NOT NULL DEFAULT 1,
    "rpe" INTEGER,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_source_externalId_key" ON "Activity"("source", "externalId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftActivity" ADD CONSTRAINT "LiftActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunActivity" ADD CONSTRAINT "RunActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_liftActivityId_fkey" FOREIGN KEY ("liftActivityId") REFERENCES "LiftActivity"("activityId") ON DELETE RESTRICT ON UPDATE CASCADE;
