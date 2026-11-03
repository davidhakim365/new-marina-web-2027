using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class LectureHomeworkFilesConfigurations : IEntityTypeConfiguration<LectureHomeworkFile>
{
    public void Configure(EntityTypeBuilder<LectureHomeworkFile> builder)
    {
        builder.ToTable("LectureHomeworkFile");
        builder.HasKey(x => new { x.LectureId, x.StudentId });
        builder.Property(x => x.Content).HasColumnType("bytea");
    }
}
