-- Add visibility and test_type columns to tests table
ALTER TABLE "tests" 
ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private',
ADD COLUMN IF NOT EXISTS "test_type" TEXT NOT NULL DEFAULT 'formal';

-- Update existing tests to have appropriate values based on context
-- Tests with course_id will remain 'private' (default) and 'formal' (default)
-- Tests without course_id will be made 'public' and 'practice' for better usability
UPDATE "tests" 
SET "visibility" = 'public', "test_type" = 'practice'
WHERE "course_id" IS NULL;

-- Add an index to improve query performance when filtering by visibility
CREATE INDEX IF NOT EXISTS "tests_visibility_idx" ON "tests"("visibility");