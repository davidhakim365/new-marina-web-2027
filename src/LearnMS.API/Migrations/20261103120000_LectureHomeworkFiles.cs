using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261103120000_LectureHomeworkFiles")]
public partial class LectureHomeworkFiles : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "LectureHomeworkFile" (
                "LectureId" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "Content" bytea NOT NULL,
                CONSTRAINT "PK_LectureHomeworkFile" PRIMARY KEY ("LectureId", "StudentId")
            );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "LectureHomeworkFile";
            """);
    }
}
