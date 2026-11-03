CREATE TABLE IF NOT EXISTS "LectureHomeworkFile" (
    "LectureId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "Content" bytea NOT NULL,
    CONSTRAINT "PK_LectureHomeworkFile" PRIMARY KEY ("LectureId", "StudentId")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20261103120000_LectureHomeworkFiles', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261103120000_LectureHomeworkFiles'
);
