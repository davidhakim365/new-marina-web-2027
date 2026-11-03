using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261103131500_LectureHomeworkFileContent")]
public partial class LectureHomeworkFileContent : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
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
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LectureHomework" DROP COLUMN IF EXISTS "FileContent";
            """);
    }
}
