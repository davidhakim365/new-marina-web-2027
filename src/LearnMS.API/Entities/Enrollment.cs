using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Enrollment
{
    Active,
    Expired,
    NotEnrolled
}