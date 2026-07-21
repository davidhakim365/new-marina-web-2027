using LearnMS.API.Entities;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record GetStudentsStatisticsQuery;

public sealed record StudentsStatisticsResult
{
    public required int TotalStudents { get; init; }
    public required int DeviceLinkedCount { get; init; }
    public required IReadOnlyList<StudentsLevelBucket> ByLevel { get; init; }
    public required IReadOnlyList<StudentsGovernorateBucket> ByGovernorate { get; init; }
}

public sealed record StudentsLevelBucket
{
    public required StudentLevel Level { get; init; }
    public required int Count { get; init; }
}

public sealed record StudentsGovernorateBucket
{
    public required string Governorate { get; init; }
    public required int Count { get; init; }
}
