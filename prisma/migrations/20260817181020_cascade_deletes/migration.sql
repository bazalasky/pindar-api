-- DropForeignKey
ALTER TABLE "LiftActivity" DROP CONSTRAINT "LiftActivity_activityId_fkey";

-- DropForeignKey
ALTER TABLE "RunActivity" DROP CONSTRAINT "RunActivity_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Set" DROP CONSTRAINT "Set_liftActivityId_fkey";

-- AddForeignKey
ALTER TABLE "LiftActivity" ADD CONSTRAINT "LiftActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunActivity" ADD CONSTRAINT "RunActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_liftActivityId_fkey" FOREIGN KEY ("liftActivityId") REFERENCES "LiftActivity"("activityId") ON DELETE CASCADE ON UPDATE CASCADE;
