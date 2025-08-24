/*
  Warnings:

  - A unique constraint covering the columns `[parentId,slug]` on the table `MenuItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ThemeCategory" AS ENUM ('GENERAL', 'BUSINESS', 'BLOG', 'PORTFOLIO', 'ECOMMERCE', 'LANDING', 'CREATIVE', 'MINIMALIST');

-- CreateEnum
CREATE TYPE "public"."HeaderStyle" AS ENUM ('DEFAULT', 'CENTERED', 'SPLIT', 'MINIMAL', 'STICKY', 'TRANSPARENT');

-- CreateEnum
CREATE TYPE "public"."FooterStyle" AS ENUM ('DEFAULT', 'MINIMAL', 'COLUMNS', 'CENTERED', 'SOCIAL_FOCUSED');

-- CreateEnum
CREATE TYPE "public"."ButtonStyle" AS ENUM ('ROUNDED', 'SQUARE', 'PILL', 'OUTLINED', 'GHOST', 'GRADIENT');

-- CreateEnum
CREATE TYPE "public"."CardStyle" AS ENUM ('ELEVATED', 'FLAT', 'OUTLINED', 'MINIMAL', 'GLASS');

-- CreateEnum
CREATE TYPE "public"."ShadowStyle" AS ENUM ('NONE', 'SOFT', 'MEDIUM', 'STRONG', 'COLORED');

-- AlterTable
ALTER TABLE "public"."ThemeSettings" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
ADD COLUMN     "animationSpeed" TEXT NOT NULL DEFAULT '300ms',
ADD COLUMN     "borderColor" TEXT NOT NULL DEFAULT '#e2e8f0',
ADD COLUMN     "borderRadius" TEXT NOT NULL DEFAULT '8px',
ADD COLUMN     "borderWidth" TEXT NOT NULL DEFAULT '1px',
ADD COLUMN     "buttonStyle" "public"."ButtonStyle" NOT NULL DEFAULT 'ROUNDED',
ADD COLUMN     "cardStyle" "public"."CardStyle" NOT NULL DEFAULT 'ELEVATED',
ADD COLUMN     "category" "public"."ThemeCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "containerWidth" TEXT NOT NULL DEFAULT '1200px',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "errorColor" TEXT NOT NULL DEFAULT '#dc2626',
ADD COLUMN     "fontBody" TEXT NOT NULL DEFAULT 'Inter',
ADD COLUMN     "fontHeading" TEXT NOT NULL DEFAULT 'Inter',
ADD COLUMN     "fontScaleRatio" DOUBLE PRECISION NOT NULL DEFAULT 1.25,
ADD COLUMN     "fontSizeBase" TEXT NOT NULL DEFAULT '16px',
ADD COLUMN     "footerStyle" "public"."FooterStyle" NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "formStyle" TEXT NOT NULL DEFAULT 'modern',
ADD COLUMN     "headerStyle" "public"."HeaderStyle" NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "letterSpacing" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "lineHeightBase" DOUBLE PRECISION NOT NULL DEFAULT 1.6,
ADD COLUMN     "navigationStyle" TEXT NOT NULL DEFAULT 'horizontal',
ADD COLUMN     "previewImage" TEXT,
ADD COLUMN     "shadowStyle" "public"."ShadowStyle" NOT NULL DEFAULT 'SOFT',
ADD COLUMN     "spacingUnit" TEXT NOT NULL DEFAULT '1rem',
ADD COLUMN     "successColor" TEXT NOT NULL DEFAULT '#16a34a',
ADD COLUMN     "surfaceAltColor" TEXT NOT NULL DEFAULT '#f8fafc',
ADD COLUMN     "surfaceColor" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "textColor" TEXT NOT NULL DEFAULT '#1e293b',
ADD COLUMN     "textSecondary" TEXT NOT NULL DEFAULT '#64748b',
ADD COLUMN     "version" TEXT NOT NULL DEFAULT '1.0.0',
ADD COLUMN     "warningColor" TEXT NOT NULL DEFAULT '#d97706',
ALTER COLUMN "primaryColor" SET DEFAULT '#2563eb',
ALTER COLUMN "secondaryColor" SET DEFAULT '#64748b';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MenuItem_parentId_slug_key" ON "public"."MenuItem"("parentId", "slug");

-- CreateIndex
CREATE INDEX "ThemeSettings_category_idx" ON "public"."ThemeSettings"("category");
