using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class StudentLectureConfigurations : IEntityTypeConfiguration<LectureEnrollment>
{
    public void Configure(EntityTypeBuilder<LectureEnrollment> builder)
    {
        builder.HasKey(x => new { x.StudentId, x.LectureId });

        // Many students can buy the same lecture; one student can buy many lectures.
        // The previous WithOne mapping hid existing enrollments and caused re-billing.
    }
}