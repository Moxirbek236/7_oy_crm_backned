/*
  Warnings:

  - The `week_day` column on the `Group` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Group" DROP COLUMN "week_day",
ADD COLUMN     "week_day" TEXT[];
