namespace LearnMS.API.Features.Auth.Contracts;

public sealed record CheckStudentAvailabilityQuery
{
    public string? StudentCode { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
}

public sealed record CheckStudentAvailabilityResult
{
    public bool StudentCodeAvailable { get; init; } = true;
    public bool PhoneNumberAvailable { get; init; } = true;
    public bool EmailAvailable { get; init; } = true;
}
