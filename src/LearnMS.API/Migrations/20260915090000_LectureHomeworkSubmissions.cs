using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260915090000_LectureHomeworkSubmissions")]
public partial class LectureHomeworkSubmissions : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LectureHomework" ALTER COLUMN "Score" DROP NOT NULL;
            ALTER TABLE "LectureHomework" ADD COLUMN IF NOT EXISTS "SubmissionFileName" text NULL;
            ALTER TABLE "LectureHomework" ADD COLUMN IF NOT EXISTS "SubmittedAt" timestamp with time zone NULL;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LectureHomework" DROP COLUMN IF EXISTS "SubmissionFileName";
            ALTER TABLE "LectureHomework" DROP COLUMN IF EXISTS "SubmittedAt";
            ALTER TABLE "LectureHomework" ALTER COLUMN "Score" SET NOT NULL;
            """);
    }
}
