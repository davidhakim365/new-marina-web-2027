using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CallCenterHistoryAction
{
    Called,
    Uncalled,
    Comment,
    Notify
}

/// <summary>
/// Append-only history of call-center actions (call flag, comments, WhatsApp notify).
/// </summary>
public sealed class CallCenterHistoryEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; set; } = null!;
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid ActorId { get; set; }
    public required string ActorName { get; set; }
    public CallCenterHistoryAction Action { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
