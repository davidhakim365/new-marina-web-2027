using LearnMS.API.Common;

namespace LearnMS.API.Features.CallCenter;

public static class CallCenterErrors
{
    public static readonly ApiError LectureNotFound = new(
        "call-center/lecture-not-found",
        "Lecture not found",
        StatusCodes.Status404NotFound
    );

    public static readonly ApiError StudentNotFound = new(
        "call-center/student-not-found",
        "Student not found for this lecture level",
        StatusCodes.Status404NotFound
    );
}
