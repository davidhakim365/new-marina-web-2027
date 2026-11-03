ALTER TABLE "LectureHomework" ADD COLUMN IF NOT EXISTS "FileContent" bytea NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'LectureHomeworkFile'
    ) THEN
        UPDATE "LectureHomework" AS homework
        SET "FileContent" = stored."Content"
        FROM "LectureHomeworkFile" AS stored
        WHERE homework."LectureId" = stored."LectureId"
          AND homework."StudentId" = stored."StudentId"
          AND homework."FileContent" IS NULL
          AND stored."Content" IS NOT NULL;
    END IF;
END $$;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20261103131500_LectureHomeworkFileContent', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261103131500_LectureHomeworkFileContent'
);
