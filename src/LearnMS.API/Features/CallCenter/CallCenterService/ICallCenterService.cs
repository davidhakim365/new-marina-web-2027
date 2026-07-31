using LearnMS.API.Features.CallCenter.Contracts;

namespace LearnMS.API.Features.CallCenter;

public interface ICallCenterService
{
    Task<CallCenterLectureMeta> GetLectureMetaAsync(Guid courseId, Guid lectureId);
    Task<PageList<CallCenterStudentDto>> QueryStudentsAsync(GetCallCenterStudentsQuery query);
    Task<CallCenterStudentDto> UpdateContactAsync(UpdateCallCenterContactCommand command);
    IAsyncEnumerable<IEnumerable<ExportCallCenterStudentRow>> ExportStudentsAsync(
        ExportCallCenterStudentsQuery query
    );
}
