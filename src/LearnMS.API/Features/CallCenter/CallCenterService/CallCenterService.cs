using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.CallCenter.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.CallCenter;

public sealed class CallCenterService(AppDbContext context) : ICallCenterService
{
    public async Task<CallCenterLectureMeta> GetLectureMetaAsync(Guid courseId, Guid lectureId)
    {
        var lecture = await context.Set<Lecture>()
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == lectureId && x.CourseId == courseId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        return new CallCenterLectureMeta
        {
            LectureId = lecture.Id,
            LectureTitle = lecture.Title,
            CourseId = lecture.CourseId,
            CourseTitle = lecture.Course.Title ?? "Course",
            Level = lecture.Course.Level,
            QuizFullMark = lecture.QuizFullMark,
            HomeworkFullMark = lecture.HomeworkFullMark,
        };
    }

    public async Task<PageList<CallCenterStudentDto>> QueryStudentsAsync(GetCallCenterStudentsQuery query)
    {
        var lecture = await context.Set<Lecture>()
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == query.LectureId && x.CourseId == query.CourseId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        var search = query.Search?.Trim().ToLower();

        var studentsQuery = context.Set<Student>()
            .AsNoTracking()
            .Where(x => x.Level == lecture.Course.Level)
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == query.LectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == query.LectureId).Take(1))
            .Include(x => x.QuizSubmissions.Where(s => s.Quiz.LectureId == query.LectureId))
                .ThenInclude(s => s.Quiz)
            .OrderBy(x => x.StudentCode)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            studentsQuery = studentsQuery.Where(x =>
                x.FullName.ToLower().Contains(search)
                || x.StudentCode.ToLower().Contains(search)
                || x.ParentPhoneNumber.Contains(search)
                || x.PhoneNumber.Contains(search));
        }

        if (query.Absent == true)
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.LectureAttendances.Any(a => a.LectureId == query.LectureId && a.AttendedAt != null));
        }
        else if (query.Absent == false)
        {
            studentsQuery = studentsQuery.Where(x =>
                x.LectureAttendances.Any(a => a.LectureId == query.LectureId && a.AttendedAt != null));
        }

        var contacts = await context.Set<CallCenterContact>()
            .AsNoTracking()
            .Where(c => c.LectureId == query.LectureId)
            .ToDictionaryAsync(c => c.StudentId);

        if (query.Called == true)
        {
            var calledIds = contacts.Where(c => c.Value.Called).Select(c => c.Key).ToHashSet();
            studentsQuery = studentsQuery.Where(x => calledIds.Contains(x.Id));
        }
        else if (query.Called == false)
        {
            var calledIds = contacts.Where(c => c.Value.Called).Select(c => c.Key).ToHashSet();
            studentsQuery = studentsQuery.Where(x => !calledIds.Contains(x.Id));
        }

        var page = await PageList<Student>.CreateAsync(studentsQuery, query.Page, query.PageSize);

        var items = page.Items.Select(student =>
        {
            contacts.TryGetValue(student.Id, out var contact);
            return MapStudent(student, lecture, contact);
        }).ToList();

        return new PageList<CallCenterStudentDto>(items, page.Page, page.PageSize, page.TotalCount);
    }

    public async Task<CallCenterStudentDto> UpdateContactAsync(UpdateCallCenterContactCommand command)
    {
        var lecture = await context.Set<Lecture>()
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == command.LectureId && x.CourseId == command.CourseId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);

        var student = await context.Set<Student>()
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == command.LectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == command.LectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == command.LectureId).Take(1))
            .Include(x => x.QuizSubmissions.Where(s => s.Quiz.LectureId == command.LectureId))
                .ThenInclude(s => s.Quiz)
            .FirstOrDefaultAsync(x => x.Id == command.StudentId && x.Level == lecture.Course.Level)
            ?? throw new ApiException(CallCenterErrors.StudentNotFound);

        var contact = await context.Set<CallCenterContact>()
            .FirstOrDefaultAsync(c => c.LectureId == command.LectureId && c.StudentId == command.StudentId);

        if (contact is null)
        {
            contact = new CallCenterContact
            {
                LectureId = command.LectureId,
                StudentId = command.StudentId,
            };
            context.Add(contact);
        }

        if (command.Comment is not null)
            contact.Comment = string.IsNullOrWhiteSpace(command.Comment) ? null : command.Comment.Trim();

        if (command.Called is not null)
        {
            contact.Called = command.Called.Value;
            contact.CalledAt = command.Called.Value ? DateTime.UtcNow : null;
        }

        contact.UpdatedAt = DateTime.UtcNow;
        contact.UpdatedBy = command.ActorId;

        await context.SaveChangesAsync();

        return MapStudent(student, lecture, contact);
    }

    private static CallCenterStudentDto MapStudent(
        Student student,
        Lecture lecture,
        CallCenterContact? contact)
    {
        var attendance = student.LectureAttendances.FirstOrDefault(a => a.LectureId == lecture.Id);
        var (chooseCorrect, chooseTotal, essayCorrect, essayTotal, essayPending) =
            SummarizeOnlineHomework(student.QuizSubmissions);

        return new CallCenterStudentDto
        {
            Id = student.Id,
            StudentCode = student.StudentCode,
            FullName = student.FullName,
            ParentPhoneNumber = student.ParentPhoneNumber,
            Attended = attendance is { AttendedAt: not null },
            QuizScore = student.LectureQuizzes.FirstOrDefault(q => q.LectureId == lecture.Id)?.Score,
            QuizFullMark = lecture.QuizFullMark,
            HomeworkScore = student.LectureHomeworks.FirstOrDefault(h => h.LectureId == lecture.Id)?.Score,
            HomeworkFullMark = lecture.HomeworkFullMark,
            ChooseCorrect = chooseTotal > 0 ? chooseCorrect : null,
            ChooseTotal = chooseTotal > 0 ? chooseTotal : null,
            EssayCorrect = essayTotal > 0 ? essayCorrect : null,
            EssayTotal = essayTotal > 0 ? essayTotal : null,
            EssayPending = essayPending > 0 ? essayPending : null,
            Comment = contact?.Comment,
            Called = contact?.Called ?? false,
            CalledAt = contact?.CalledAt,
        };
    }

    private static (int chooseCorrect, int chooseTotal, int essayCorrect, int essayTotal, int essayPending)
        SummarizeOnlineHomework(IEnumerable<QuizSubmission> submissions)
    {
        var chooseCorrect = 0;
        var chooseTotal = 0;
        var essayCorrect = 0;
        var essayTotal = 0;
        var essayPending = 0;

        foreach (var submission in submissions)
        {
            List<QuestionSubmission> questions;
            try
            {
                questions = submission.QuestionSubmissions;
            }
            catch
            {
                continue;
            }

            foreach (var question in questions)
            {
                switch (question)
                {
                    case MultipleChoiceSubmission mc:
                        chooseTotal++;
                        if (mc.IsCorrect) chooseCorrect++;
                        break;
                    case EssaySubmission essay:
                        essayTotal++;
                        if (essay.IsPendingGrade) essayPending++;
                        else if (essay.IsCorrect) essayCorrect++;
                        break;
                }
            }
        }

        return (chooseCorrect, chooseTotal, essayCorrect, essayTotal, essayPending);
    }
}
