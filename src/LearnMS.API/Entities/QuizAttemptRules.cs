namespace LearnMS.API.Entities;

public static class QuizAttemptRules
{
    public static DateTime AsUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);

    public static DateTimeOffset? ToUtcOffset(DateTime? value) =>
        value is { } t ? new DateTimeOffset(AsUtc(t)) : null;

    /// <summary>
    /// Leftover / timezone-skewed attempts look "started" to some phones and
    /// immediately show Retake. Reset those so the student can start clean.
    /// </summary>
    public static bool MustReset(QuizAttempt? attempt, int expiryMinutes, DateTime utcNow)
    {
        if (attempt is null)
            return false;

        if (attempt.ExpiresAt is null)
            return expiryMinutes > 0;

        var expiresAt = AsUtc(attempt.ExpiresAt.Value);
        if (expiresAt.Year < 2000)
            return true;

        var remaining = expiresAt - utcNow;
        if (remaining <= TimeSpan.FromSeconds(30))
            return true;

        if (expiryMinutes > 0 && remaining > TimeSpan.FromMinutes(expiryMinutes + 2))
            return true;

        return false;
    }
}
