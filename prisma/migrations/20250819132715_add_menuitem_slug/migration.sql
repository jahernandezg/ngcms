/*
  Warnings:

  - A unique constraint covering the columns `[parentId,slug]` on the table `MenuItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
-- CREATE UNIQUE INDEX IF NOT EXISTS "MenuItem_parentId_slug_key" ON "public"."MenuItem"("parentId", "slug");
