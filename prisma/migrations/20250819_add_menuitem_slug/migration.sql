-- Add slug column to MenuItem
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "slug" TEXT;
-- Backfill slug with a slugified version of title if null (simple lower/replace, may refine in app code)
UPDATE "MenuItem" SET "slug" = LOWER(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE "slug" IS NULL;
-- Ensure not null afterwards
ALTER TABLE "MenuItem" ALTER COLUMN "slug" SET NOT NULL;
-- Add composite uniqueness per parent (siblings unique)
CREATE UNIQUE INDEX IF NOT EXISTS "MenuItem_parentId_slug_key" ON "MenuItem"(COALESCE("parentId", ''), "slug");
