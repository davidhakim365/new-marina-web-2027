using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260830190000_LessonAttendanceStartedAt")]
public partial class LessonAttendanceStartedAt : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LessonAttendance"
            ADD COLUMN IF NOT EXISTS "StartedAt" timestamp with time zone NULL;

            UPDATE "LessonAttendance" AS la
            SET "StartedAt" = la."ExpirationDate" - (COALESCE(l."ExpirationHours", 0) * INTERVAL '1 hour')
            FROM "Lessons" AS l
            WHERE la."LessonId" = l."Id"
              AND la."StartedAt" IS NULL
              AND la."ExpirationDate" IS NOT NULL
              AND COALESCE(l."ExpirationHours", 0) > 0;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "LessonAttendance" DROP COLUMN IF EXISTS "StartedAt";
            """);
    }
}
