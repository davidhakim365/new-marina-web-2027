using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class CallCenterContactConfigurations : IEntityTypeConfiguration<CallCenterContact>
{
    public void Configure(EntityTypeBuilder<CallCenterContact> builder)
    {
        builder.ToTable("CallCenterContact");
        builder.HasKey(x => new { x.LectureId, x.StudentId });

        builder.Property(x => x.Comment).HasMaxLength(2000);
        builder.Property(x => x.Called).HasDefaultValue(false);
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("NOW()");

        builder
            .HasOne(x => x.Lecture)
            .WithMany()
            .HasForeignKey(x => x.LectureId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.Student)
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.LectureId);
        builder.HasIndex(x => x.StudentId);
    }
}
