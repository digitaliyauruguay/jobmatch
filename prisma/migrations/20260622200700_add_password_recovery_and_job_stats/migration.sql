-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "hiredWorkerId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiry" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_hiredWorkerId_fkey" FOREIGN KEY ("hiredWorkerId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
