namespace LearnMS.API.Entities;

public sealed class LectureHomeworkFile
{
    public Guid LectureId { get; set; }
    public Guid StudentId { get; set; }
    public byte[]? Content { get; set; }
}
