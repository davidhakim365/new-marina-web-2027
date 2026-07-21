using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20260716180000_AssetGoogleDriveLinks")]
public partial class AssetGoogleDriveLinks : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Idempotent: existing DBs may already have applied this via the .sql companion script
        migrationBuilder.Sql("""
            ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "Url" text NULL;
            ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "LectureName" text NULL;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Asset" DROP COLUMN IF EXISTS "Url";
            ALTER TABLE "Asset" DROP COLUMN IF EXISTS "LectureName";
            """);
    }
}
