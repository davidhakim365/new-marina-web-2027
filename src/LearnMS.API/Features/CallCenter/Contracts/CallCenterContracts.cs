using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.CallCenter.Contracts;

public sealed record GetCallCenterStudentsQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public string? Search { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public bool? Called { get; init; }
    public bool? Absent { get; init; }
}

public sealed record UpdateCallCenterContactCommand
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
    public required Guid ActorId { get; init; }
    public string? Comment { get; init; }
    public bool? Called { get; init; }
}

public sealed record CallCenterStudentDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string ParentPhoneNumber { get; init; }
    [Required] public required bool Attended { get; init; }
    public decimal? QuizScore { get; init; }
    public decimal? QuizFullMark { get; init; }
    public decimal? HomeworkScore { get; init; }
    public decimal? HomeworkFullMark { get; init; }
    public int? ChooseCorrect { get; init; }
    public int? ChooseTotal { get; init; }
    public int? EssayCorrect { get; init; }
    public int? EssayTotal { get; init; }
    public int? EssayPending { get; init; }
    public string? Comment { get; init; }
    [Required] public required bool Called { get; init; }
    public DateTime? CalledAt { get; init; }
}

public sealed record UpdateCallCenterContactRequest
{
    public string? Comment { get; init; }
    public bool? Called { get; init; }
}

public sealed record CallCenterLectureMeta
{
    [Required] public required Guid LectureId { get; init; }
    [Required] public required string LectureTitle { get; init; }
    [Required] public required Guid CourseId { get; init; }
    [Required] public required string CourseTitle { get; init; }
    public StudentLevel? Level { get; init; }
    public decimal? QuizFullMark { get; init; }
    public decimal? HomeworkFullMark { get; init; }
}

public sealed record ExportCallCenterStudentsQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public string? Search { get; init; }
    public bool? Called { get; init; }
    public bool? Absent { get; init; }
}

public sealed record ExportCallCenterStudentRow
{
    public required string StudentCode { get; init; }
    public required string FullName { get; init; }
    public required string ParentPhoneNumber { get; init; }
    public required string Attendance { get; init; }
    public string? QuizScore { get; init; }
    public string? HomeworkChoose { get; init; }
    public string? HomeworkEssay { get; init; }
    public string? OfflineHomework { get; init; }
    public string? Comment { get; init; }
    public required string Called { get; init; }
    public string? CalledAt { get; init; }
}
