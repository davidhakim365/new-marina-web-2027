using System.Globalization;
using System.Text;
using CsvHelper;
using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Features.CallCenter.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.CallCenter;

[Route("api/call-center")]
[Tags("CallCenter")]
public sealed class CallCenterController(ICallCenterService callCenterService) : ControllerBase
{
    [HttpGet("courses/{courseId:guid}/lectures/{lectureId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "GetCallCenterLecture")]
    public async Task<ApiWrapper.Success<CallCenterLectureMeta>> GetLecture(
        Guid courseId,
        Guid lectureId)
    {
        var data = await callCenterService.GetLectureMetaAsync(courseId, lectureId);
        return new ApiWrapper.Success<CallCenterLectureMeta>
        {
            Data = data,
            Message = "Lecture loaded"
        };
    }

    [HttpGet("courses/{courseId:guid}/lectures/{lectureId:guid}/students")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "GetCallCenterStudents")]
    public async Task<ApiWrapper.Success<PageList<CallCenterStudentDto>>> GetStudents(
        Guid courseId,
        Guid lectureId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? called = null,
        [FromQuery] bool? absent = null,
        [FromQuery] bool? online = null)
    {
        var data = await callCenterService.QueryStudentsAsync(
            new GetCallCenterStudentsQuery
            {
                CourseId = courseId,
                LectureId = lectureId,
                Page = page < 1 ? 1 : page,
                PageSize = pageSize is < 1 or > 100 ? 20 : pageSize,
                Search = search,
                Called = called,
                Absent = absent,
                Online = online,
            });

        return new ApiWrapper.Success<PageList<CallCenterStudentDto>>
        {
            Data = data,
            Message = "Call center students fetched successfully"
        };
    }

    [HttpPatch("courses/{courseId:guid}/lectures/{lectureId:guid}/students/{studentId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "UpdateCallCenterContact")]
    public async Task<ApiWrapper.Success<CallCenterStudentDto>> UpdateContact(
        Guid courseId,
        Guid lectureId,
        Guid studentId,
        [FromBody] UpdateCallCenterContactRequest request)
    {
        var actor = HttpContext.CurrentUser()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        var data = await callCenterService.UpdateContactAsync(
            new UpdateCallCenterContactCommand
            {
                CourseId = courseId,
                LectureId = lectureId,
                StudentId = studentId,
                ActorId = actor.Id,
                ActorRole = actor.Role,
                Comment = request.Comment,
                Called = request.Called,
            });

        return new ApiWrapper.Success<CallCenterStudentDto>
        {
            Data = data,
            Message = "Call center contact updated"
        };
    }

    [HttpPost("courses/{courseId:guid}/lectures/{lectureId:guid}/students/{studentId:guid}/notify")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "LogCallCenterNotify")]
    public async Task<ApiWrapper.Success<CallCenterStudentDto>> LogNotify(
        Guid courseId,
        Guid lectureId,
        Guid studentId,
        [FromBody] LogCallCenterNotifyRequest request)
    {
        var actor = HttpContext.CurrentUser()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        var data = await callCenterService.LogNotifyAsync(
            new LogCallCenterNotifyCommand
            {
                CourseId = courseId,
                LectureId = lectureId,
                StudentId = studentId,
                ActorId = actor.Id,
                ActorRole = actor.Role,
                Comment = request.Comment,
                MarkCalled = request.MarkCalled ?? true,
            });

        return new ApiWrapper.Success<CallCenterStudentDto>
        {
            Data = data,
            Message = "Notify logged successfully"
        };
    }

    [HttpGet("courses/{courseId:guid}/lectures/{lectureId:guid}/students/{studentId:guid}/history")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ViewCallCenterHistory])]
    [SwaggerOperation(OperationId = "GetCallCenterHistory")]
    public async Task<ApiWrapper.Success<PageList<CallCenterHistoryItemDto>>> GetHistory(
        Guid courseId,
        Guid lectureId,
        Guid studentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var data = await callCenterService.QueryHistoryAsync(
            new GetCallCenterHistoryQuery
            {
                CourseId = courseId,
                LectureId = lectureId,
                StudentId = studentId,
                Page = page < 1 ? 1 : page,
                PageSize = pageSize is < 1 or > 100 ? 20 : pageSize,
            });

        return new ApiWrapper.Success<PageList<CallCenterHistoryItemDto>>
        {
            Data = data,
            Message = "Call center history fetched successfully"
        };
    }

    [HttpGet("courses/{courseId:guid}/lectures/{lectureId:guid}/students/export")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCallCenter])]
    [SwaggerOperation(OperationId = "ExportCallCenterStudents")]
    public async Task<IActionResult> ExportStudents(
        Guid courseId,
        Guid lectureId,
        [FromQuery] string? search = null,
        [FromQuery] bool? called = null,
        [FromQuery] bool? absent = null,
        [FromQuery] bool? online = null)
    {
        var data = callCenterService.ExportStudentsAsync(
            new ExportCallCenterStudentsQuery
            {
                CourseId = courseId,
                LectureId = lectureId,
                Search = search,
                Called = called,
                Absent = absent,
                Online = online,
            });

        Response.Headers.Append("Content-Type", "text/csv; charset=utf-8");
        Response.Headers.Append(
            "Content-Disposition",
            $"attachment; filename=call-center-{lectureId:N}.csv"
        );

        await using var sw = new StreamWriter(Response.Body, new UTF8Encoding(encoderShouldEmitUTF8Identifier: true));
        await using var csv = new CsvWriter(sw, CultureInfo.InvariantCulture);

        await foreach (var records in data)
        {
            await csv.WriteRecordsAsync(records);
            await csv.FlushAsync();
            await sw.FlushAsync();
        }

        return new EmptyResult();
    }
}
