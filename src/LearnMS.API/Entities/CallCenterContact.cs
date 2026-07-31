namespace LearnMS.API.Entities;

/// <summary>
/// Call-center follow-up state for a student in a specific lecture.
/// </summary>
public sealed class CallCenterContact
{
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; set; } = null!;
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public string? Comment { get; set; }
    public bool Called { get; set; }
    public DateTime? CalledAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedBy { get; set; }
}
