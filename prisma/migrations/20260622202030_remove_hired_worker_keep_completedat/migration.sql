/*
  Warnings:

  - You are about to drop the column `hiredWorkerId` on the `Job` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_hiredWorkerId_fkey";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "hiredWorkerId";
