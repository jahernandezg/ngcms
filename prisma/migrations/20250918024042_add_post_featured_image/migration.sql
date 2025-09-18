/*
  Warnings:

  - A unique constraint covering the columns `[parentId,slug]` on the table `MenuItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "featuredImage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_parentId_slug_key" ON "public"."MenuItem"("parentId", "slug");
