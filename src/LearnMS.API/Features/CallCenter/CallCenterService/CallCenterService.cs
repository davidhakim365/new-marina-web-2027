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
        var lecture = await LoadLectureAsync(query.CourseId, query.LectureId);
        var studentsQuery = BuildStudentsQuery(lecture, query.LectureId, query.Search, query.Called, query.Absent);

        var contacts = await context.Set<CallCenterContact>()
            .AsNoTracking()
            .Where(c => c.LectureId == query.LectureId)
            .ToDictionaryAsync(c => c.StudentId);

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
        var lecture = await LoadLectureAsync(command.CourseId, command.LectureId);

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

    public async IAsyncEnumerable<IEnumerable<ExportCallCenterStudentRow>> ExportStudentsAsync(
        ExportCallCenterStudentsQuery query)
    {
        var lecture = await LoadLectureAsync(query.CourseId, query.LectureId);
        var studentsQuery = BuildStudentsQuery(lecture, query.LectureId, query.Search, query.Called, query.Absent);

        var contacts = await context.Set<CallCenterContact>()
            .AsNoTracking()
            .Where(c => c.LectureId == query.LectureId)
            .ToDictionaryAsync(c => c.StudentId);

        const int chunkSize = 100;
        var totalRecords = await studentsQuery.CountAsync();
        var chunks = (int)Math.Ceiling(totalRecords / (double)chunkSize);

        for (var i = 0; i < chunks; i++)
        {
            var students = await studentsQuery
                .Skip(i * chunkSize)
                .Take(chunkSize)
                .ToListAsync();

            yield return students.Select(student =>
            {
                contacts.TryGetValue(student.Id, out var contact);
                var dto = MapStudent(student, lecture, contact);
                return ToExportRow(dto);
            }).ToList();
        }
    }

    private async Task<Lecture> LoadLectureAsync(Guid courseId, Guid lectureId)
    {
        return await context.Set<Lecture>()
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == lectureId && x.CourseId == courseId)
            ?? throw new ApiException(CallCenterErrors.LectureNotFound);
    }

    private IQueryable<Student> BuildStudentsQuery(
        Lecture lecture,
        Guid lectureId,
        string? search,
        bool? called,
        bool? absent)
    {
        var studentsQuery = context.Set<Student>()
            .AsNoTracking()
            .Where(x => x.Level == lecture.Course.Level)
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == lectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == lectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == lectureId).Take(1))
            .Include(x => x.QuizSubmissions.Where(s => s.Quiz.LectureId == lectureId))
                .ThenInclude(s => s.Quiz)
            .OrderBy(x => x.StudentCode)
            .AsQueryable();

        var trimmedSearch = search?.Trim().ToLower();
        if (!string.IsNullOrEmpty(trimmedSearch))
        {
            studentsQuery = studentsQuery.Where(x =>
                x.FullName.ToLower().Contains(trimmedSearch)
                || x.StudentCode.ToLower().Contains(trimmedSearch)
                || x.ParentPhoneNumber.Contains(trimmedSearch)
                || x.PhoneNumber.Contains(trimmedSearch));
        }

        if (absent == true)
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.LectureAttendances.Any(a => a.LectureId == lectureId && a.AttendedAt != null));
        }
        else if (absent == false)
        {
            studentsQuery = studentsQuery.Where(x =>
                x.LectureAttendances.Any(a => a.LectureId == lectureId && a.AttendedAt != null));
        }

        if (called == true)
        {
            studentsQuery = studentsQuery.Where(x =>
                context.Set<CallCenterContact>().Any(c =>
                    c.LectureId == lectureId && c.StudentId == x.Id && c.Called));
        }
        else if (called == false)
        {
            studentsQuery = studentsQuery.Where(x =>
                !context.Set<CallCenterContact>().Any(c =>
                    c.LectureId == lectureId && c.StudentId == x.Id && c.Called));
        }

        return studentsQuery;
    }

    private static ExportCallCenterStudentRow ToExportRow(CallCenterStudentDto student)
    {
        static string Ratio(int? correct, int? total, int? pending = null)
        {
            if (total is null) return "";
            var value = $"{correct ?? 0}/{total}";
            return pending is > 0 ? $"{value} (pending {pending})" : value;
        }

        static string Score(decimal? score, decimal? fullMark)
        {
            if (score is null) return "";
            return fullMark is null ? $"{score}" : $"{score}/{fullMark}";
        }

        return new ExportCallCenterStudentRow
        {
            StudentCode = student.StudentCode,
            FullName = student.FullName,
            ParentPhoneNumber = student.ParentPhoneNumber,
            Attendance = student.Attended ? "Present" : "Absent",
            QuizScore = Score(student.QuizScore, student.QuizFullMark),
            HomeworkChoose = Ratio(student.ChooseCorrect, student.ChooseTotal),
            HomeworkEssay = Ratio(student.EssayCorrect, student.EssayTotal, student.EssayPending),
            OfflineHomework = Score(student.HomeworkScore, student.HomeworkFullMark),
            Comment = student.Comment ?? "",
            Called = student.Called ? "Yes" : "No",
            CalledAt = student.CalledAt?.ToString("u") ?? "",
        };
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
