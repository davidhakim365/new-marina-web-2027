using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class CallCenterHistoryEventConfigurations : IEntityTypeConfiguration<CallCenterHistoryEvent>
{
    public void Configure(EntityTypeBuilder<CallCenterHistoryEvent> builder)
    {
        builder.ToTable("CallCenterHistoryEvent");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActorName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Comment).HasMaxLength(2000);
        builder.Property(x => x.Action).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

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

        builder.HasIndex(x => new { x.LectureId, x.StudentId, x.CreatedAt });
        builder.HasIndex(x => x.ActorId);
    }
}
