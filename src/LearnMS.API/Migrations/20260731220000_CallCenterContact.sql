CREATE TABLE IF NOT EXISTS "CallCenterContact" (
    "LectureId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "Comment" character varying(2000) NULL,
    "Called" boolean NOT NULL DEFAULT FALSE,
    "CalledAt" timestamp with time zone NULL,
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedBy" uuid NULL,
    CONSTRAINT "PK_CallCenterContact" PRIMARY KEY ("LectureId", "StudentId"),
    CONSTRAINT "FK_CallCenterContact_Lectures_LectureId"
        FOREIGN KEY ("LectureId") REFERENCES "Lectures" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_CallCenterContact_Students_StudentId"
        FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_CallCenterContact_LectureId"
    ON "CallCenterContact" ("LectureId");

CREATE INDEX IF NOT EXISTS "IX_CallCenterContact_StudentId"
    ON "CallCenterContact" ("StudentId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260731220000_CallCenterContact', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260731220000_CallCenterContact'
);
