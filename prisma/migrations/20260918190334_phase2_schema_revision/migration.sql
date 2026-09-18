/*
  Warnings:

  - You are about to drop the column `duration` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `pace` on the `RunActivity` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Set` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,name]` on the table `Exercise` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[liftActivityId,setNumber]` on the table `Set` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `durationSeconds` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setNumber` to the `Set` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "duration",
ADD COLUMN     "durationSeconds" INTEGER NOT NULL,
ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "date" SET DATA TYPE DATE,
ALTER COLUMN "bodyweight" DROP NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'manual';

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RunActivity" DROP COLUMN "pace",
ALTER COLUMN "distance" DROP NOT NULL,
ALTER COLUMN "distance" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Set" DROP COLUMN "order",
ADD COLUMN     "setNumber" INTEGER NOT NULL,
ALTER COLUMN "rpe" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "Activity_userId_date_idx" ON "Activity"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_userId_name_key" ON "Exercise"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Set_liftActivityId_setNumber_key" ON "Set"("liftActivityId", "setNumber");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
