/*
  Warnings:

  - A unique constraint covering the columns `[parentId,slug]` on the table `MenuItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."blog_config" (
    "id" TEXT NOT NULL,
    "blogName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "siteUrl" VARCHAR(255),
    "logoLight" TEXT,
    "logoDark" TEXT,
    "favicon" TEXT,
    "defaultPostImage" TEXT,
    "metaDescription" VARCHAR(160),
    "keywords" TEXT,
    "analyticsId" VARCHAR(50),
    "searchConsoleCode" TEXT,
    "ogImage" TEXT,
    "contactEmail" VARCHAR(100),
    "socialTwitter" VARCHAR(255),
    "socialLinkedIn" VARCHAR(255),
    "socialGithub" VARCHAR(255),
    "socialInstagram" VARCHAR(255),
    "locale" VARCHAR(10) NOT NULL DEFAULT 'es-ES',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Europe/Madrid',
    "postsPerPage" INTEGER NOT NULL DEFAULT 10,
    "enableComments" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (guarded to avoid duplicate errors on re-apply)
-- CREATE UNIQUE INDEX IF NOT EXISTS "MenuItem_parentId_slug_key" ON "public"."MenuItem"("parentId", "slug");
