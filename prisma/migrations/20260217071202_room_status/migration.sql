/*
  Warnings:

  - A unique constraint covering the columns `[student_id,group_id]` on the table `StudentGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StudentGroup_student_id_group_id_key" ON "StudentGroup"("student_id", "group_id");
