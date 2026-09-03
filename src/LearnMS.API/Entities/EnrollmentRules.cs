namespace LearnMS.API.Entities;

public static class EnrollmentRules
{
    /// <summary>
    /// Zero or missing expiration means lifetime access. A 0-day window would expire
    /// immediately and charge the student again on the next visit.
    /// </summary>
    public static DateTime ComputeExpiresAt(int? expirationDays)
    {
        if (expirationDays is null or <= 0)
            return DateTime.UtcNow.AddYears(50);

        return DateTime.UtcNow.AddDays(expirationDays.Value);
    }

    public static bool IsActive(DateTime? expiresAt, int? expirationDays)
    {
        if (expiresAt is null)
            return false;

        if (expirationDays is <= 0)
            return true;

        return expiresAt > DateTime.UtcNow;
    }

    public static Enrollment ToStatus(DateTime? expiresAt, int? expirationDays)
    {
        if (expiresAt is null)
            return Enrollment.NotEnrolled;

        if (IsActive(expiresAt, expirationDays))
            return Enrollment.Active;

        return Enrollment.Expired;
    }

    public static DateTime? EffectiveExpiresAt(DateTime? expiresAt, int? expirationDays)
    {
        if (expiresAt is null)
            return null;

        if (expirationDays is <= 0)
            return DateTime.UtcNow.AddYears(50);

        return expiresAt;
    }
}
