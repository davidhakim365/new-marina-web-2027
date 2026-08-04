using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260804090000_CallCenterHistory")]
public partial class CallCenterHistoryMigration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "CallCenterHistoryEvent" (
                "Id" uuid NOT NULL,
                "LectureId" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "ActorId" uuid NOT NULL,
                "ActorName" character varying(200) NOT NULL,
                "Action" character varying(32) NOT NULL,
                "Comment" character varying(2000) NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                CONSTRAINT "PK_CallCenterHistoryEvent" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_CallCenterHistoryEvent_Lectures_LectureId"
                    FOREIGN KEY ("LectureId") REFERENCES "Lectures" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_CallCenterHistoryEvent_Students_StudentId"
                    FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "IX_CallCenterHistoryEvent_Lecture_Student_CreatedAt"
                ON "CallCenterHistoryEvent" ("LectureId", "StudentId", "CreatedAt");

            CREATE INDEX IF NOT EXISTS "IX_CallCenterHistoryEvent_ActorId"
                ON "CallCenterHistoryEvent" ("ActorId");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DROP TABLE IF EXISTS "CallCenterHistoryEvent";""");
    }
}
