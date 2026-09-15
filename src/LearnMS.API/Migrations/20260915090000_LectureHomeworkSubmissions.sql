ALTER TABLE "LectureHomework" ALTER COLUMN "Score" DROP NOT NULL;
ALTER TABLE "LectureHomework" ADD COLUMN IF NOT EXISTS "SubmissionFileName" text NULL;
ALTER TABLE "LectureHomework" ADD COLUMN IF NOT EXISTS "SubmittedAt" timestamp with time zone NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260915090000_LectureHomeworkSubmissions', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260915090000_LectureHomeworkSubmissions'
);
