using Microsoft.AspNetCore.Http;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record SubmitLectureHomeworkCommand
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
    public required IFormFile File { get; init; }
}

public sealed record SubmitLectureHomeworkResult
{
    public required string FileName { get; init; }
    public required DateTime SubmittedAt { get; init; }
    public decimal? Score { get; init; }
    public decimal? FullMark { get; init; }
}

public sealed record GetLectureHomeworkFileQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
}

public sealed record LectureHomeworkFileResult
{
    public required string AbsolutePath { get; init; }
    public required string DownloadName { get; init; }
}
