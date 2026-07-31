using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260731220000_CallCenterContact")]
public partial class CallCenterContactMigration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
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
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DROP TABLE IF EXISTS "CallCenterContact";""");
    }
}
