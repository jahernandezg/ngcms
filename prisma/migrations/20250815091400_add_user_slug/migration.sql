-- Add slug column to User and populate existing rows
ALTER TABLE "public"."User" ADD COLUMN "slug" TEXT;
-- Backfill slug using lowercased name with dashes; fallback to id
UPDATE "public"."User" SET "slug" = regexp_replace(lower(coalesce("name","id")), '[^a-z0-9]+', '-', 'g') WHERE "slug" IS NULL;
-- Make column NOT NULL and add unique + index
ALTER TABLE "public"."User" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "User_slug_key" ON "public"."User"("slug");
CREATE INDEX "User_slug_idx" ON "public"."User"("slug");
