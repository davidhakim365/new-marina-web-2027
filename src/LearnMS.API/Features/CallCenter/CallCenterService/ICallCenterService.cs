using LearnMS.API.Features.CallCenter.Contracts;

namespace LearnMS.API.Features.CallCenter;

public interface ICallCenterService
{
    Task<CallCenterLectureMeta> GetLectureMetaAsync(Guid courseId, Guid lectureId);
    Task<PageList<CallCenterStudentDto>> QueryStudentsAsync(GetCallCenterStudentsQuery query);
    Task<CallCenterStudentDto> UpdateContactAsync(UpdateCallCenterContactCommand command);
    Task<CallCenterStudentDto> LogNotifyAsync(LogCallCenterNotifyCommand command);
    Task<PageList<CallCenterHistoryItemDto>> QueryHistoryAsync(GetCallCenterHistoryQuery query);
    Task<IReadOnlyList<CallCenterStudentLectureDto>> QueryStudentLecturesAsync(
        GetCallCenterStudentLecturesQuery query
    );
    IAsyncEnumerable<IEnumerable<ExportCallCenterStudentRow>> ExportStudentsAsync(
        ExportCallCenterStudentsQuery query
    );
}
