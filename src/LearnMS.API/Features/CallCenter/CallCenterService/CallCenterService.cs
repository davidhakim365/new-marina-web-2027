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
        var studentsQuery = BuildStudentsQuery(
            lecture,
            query.LectureId,
            query.Search,
            query.Called,
            query.Absent,
            query.Online,
            query.HasCredit);

        var contacts = await context.Set<CallCenterContact>()
            .AsNoTracking()
            .Where(c => c.LectureId == query.LectureId)
            .ToDictionaryAsync(c => c.StudentId);

        var page = await PageList<Student>.CreateAsync(studentsQuery, query.Page, query.PageSize);

        var watchedOnlineIds = await GetWatchedOnlineStudentIdsAsync(
            query.LectureId,
            page.Items.Select(s => s.Id));

        var items = page.Items.Select(student =>
        {
            contacts.TryGetValue(student.Id, out var contact);
            return MapStudent(student, lecture, contact, watchedOnlineIds.Contains(student.Id));
        }).ToList();

        return new PageList<CallCenterStudentDto>(items, page.Page, page.PageSize, page.TotalCount);
    }

    public async Task<CallCenterStudentDto> UpdateContactAsync(UpdateCallCenterContactCommand command)
    {
        var lecture = await LoadLectureAsync(command.CourseId, command.LectureId);
        var student = await LoadStudentForLectureAsync(lecture, command.LectureId, command.StudentId);
        var contact = await GetOrCreateContactAsync(command.LectureId, command.StudentId);
        var actorName = await ResolveActorNameAsync(command.ActorId, command.ActorRole);
        var history = new List<CallCenterHistoryEvent>();

        if (command.Comment is not null)
        {
            var nextComment = string.IsNullOrWhiteSpace(command.Comment) ? null : command.Comment.Trim();
            var previousComment = contact.Comment;
            if (!string.Equals(previousComment, nextComment, StringComparison.Ordinal))
            {
                contact.Comment = nextComment;
                history.Add(CreateHistory(
                    command.LectureId,
                    command.StudentId,
                    command.ActorId,
                    actorName,
                    CallCenterHistoryAction.Comment,
                    nextComment));
            }
        }

        if (command.Called is not null && contact.Called != command.Called.Value)
        {
            contact.Called = command.Called.Value;
            contact.CalledAt = command.Called.Value ? DateTime.UtcNow : null;
            history.Add(CreateHistory(
                command.LectureId,
                command.StudentId,
                command.ActorId,
                actorName,
                command.Called.Value ? CallCenterHistoryAction.Called : CallCenterHistoryAction.Uncalled,
                contact.Comment));
        }

        contact.UpdatedAt = DateTime.UtcNow;
        contact.UpdatedBy = command.ActorId;

        if (history.Count > 0)
            context.AddRange(history);

        await context.SaveChangesAsync();

        var watchedOnline = await HasWatchedLectureOnlineAsync(command.LectureId, command.StudentId);
        return MapStudent(student, lecture, contact, watchedOnline);
    }

    public async Task<CallCenterStudentDto> LogNotifyAsync(LogCallCenterNotifyCommand command)
    {
        var lecture = await LoadLectureAsync(command.CourseId, command.LectureId);
        var student = await LoadStudentForLectureAsync(lecture, command.LectureId, command.StudentId);
        var contact = await GetOrCreateContactAsync(command.LectureId, command.StudentId);
        var actorName = await ResolveActorNameAsync(command.ActorId, command.ActorRole);
        var history = new List<CallCenterHistoryEvent>();

        if (command.Comment is not null)
        {
            var nextComment = string.IsNullOrWhiteSpace(command.Comment) ? null : command.Comment.Trim();
            if (!string.Equals(contact.Comment, nextComment, StringComparison.Ordinal))
            {
                contact.Comment = nextComment;
                history.Add(CreateHistory(
                    command.LectureId,
                    command.StudentId,
                    command.ActorId,
                    actorName,
                    CallCenterHistoryAction.Comment,
                    nextComment));
            }
        }

        if (command.MarkCalled && !contact.Called)
        {
            contact.Called = true;
            contact.CalledAt = DateTime.UtcNow;
            history.Add(CreateHistory(
                command.LectureId,
                command.StudentId,
                command.ActorId,
                actorName,
                CallCenterHistoryAction.Called,
                contact.Comment));
        }

        history.Add(CreateHistory(
            command.LectureId,
            command.StudentId,
            command.ActorId,
            actorName,
            CallCenterHistoryAction.Notify,
            contact.Comment));

        contact.UpdatedAt = DateTime.UtcNow;
        contact.UpdatedBy = command.ActorId;
        context.AddRange(history);
        await context.SaveChangesAsync();

        var watchedOnline = await HasWatchedLectureOnlineAsync(command.LectureId, command.StudentId);
        return MapStudent(student, lecture, contact, watchedOnline);
    }

    public async Task<PageList<CallCenterHistoryItemDto>> QueryHistoryAsync(GetCallCenterHistoryQuery query)
    {
        var lecture = await LoadLectureAsync(query.CourseId, query.LectureId);

        var studentExists = await context.Set<Student>()
            .AsNoTracking()
            .AnyAsync(x => x.Id == query.StudentId && x.Level == lecture.Course.Level);

        if (!studentExists)
            throw new ApiException(CallCenterErrors.StudentNotFound);

        var historyQuery = context.Set<CallCenterHistoryEvent>()
            .AsNoTracking()
            .Where(x => x.LectureId == query.LectureId && x.StudentId == query.StudentId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new CallCenterHistoryItemDto
            {
                Id = x.Id,
                Action = x.Action,
                ActorId = x.ActorId,
                ActorName = x.ActorName,
                Comment = x.Comment,
                CreatedAt = x.CreatedAt,
            });

        return await PageList<CallCenterHistoryItemDto>.CreateAsync(
            historyQuery,
            query.Page,
            query.PageSize);
    }

    public async Task<IReadOnlyList<CallCenterStudentLectureDto>> QueryStudentLecturesAsync(
        GetCallCenterStudentLecturesQuery query)
    {
        var lecture = await LoadLectureAsync(query.CourseId, query.LectureId);

        var studentExists = await context.Set<Student>()
            .AsNoTracking()
            .AnyAsync(x => x.Id == query.StudentId && x.Level == lecture.Course.Level);

        if (!studentExists)
            throw new ApiException(CallCenterErrors.StudentNotFound);

        var studentId = query.StudentId;
        var currentLectureId = query.LectureId;
        var currentCourseId = query.CourseId;
        var now = DateTime.UtcNow;

        var rows = await context.Set<Lecture>()
            .AsNoTracking()
            .Where(l => l.Course.IsPublished && l.Course.Level == lecture.Course.Level)
            .OrderBy(l => l.CourseId == currentCourseId ? 0 : 1)
            .ThenBy(l => l.Course.Title)
            .ThenBy(l => l.Order)
            .Select(l => new
            {
                l.Id,
                l.Title,
                l.CourseId,
                CourseTitle = l.Course.Title ?? "Course",
                l.Order,
                IsCurrent = l.Id == currentLectureId,
                Attended = l.LectureAttendances.Any(a => a.StudentId == studentId && a.AttendedAt != null),
                WatchedOnline = l.Lessons.Any(lesson =>
                    lesson.AttendedStudents.Any(s => s.Id == studentId)
                    || lesson.LessonAttendances.Any(a => a.StudentId == studentId)),
                QuizScore = l.LectureQuizzes
                    .Where(q => q.StudentId == studentId)
                    .Select(q => (decimal?)q.Score)
                    .FirstOrDefault(),
                l.QuizFullMark,
                OnlineCorrect = l.Quizzes
                    .SelectMany(q => q.QuizSubmissions.Where(sub => sub.StudentId == studentId))
                    .Sum(sub => (int?)sub.NumOfCorrect) ?? 0,
                OnlineTotal = l.Quizzes
                    .SelectMany(q => q.QuizSubmissions.Where(sub => sub.StudentId == studentId))
                    .Sum(sub => (int?)sub.NumOfQuestions) ?? 0,
                HomeworkScore = l.LectureHomeworks
                    .Where(h => h.StudentId == studentId)
                    .Select(h => (decimal?)h.Score)
                    .FirstOrDefault(),
                l.HomeworkFullMark,
                EnrollmentStatus = l.LectureEnrollments
                    .Where(e => e.StudentId == studentId)
                    .Select(e => e.ExpiresAt >= now ? "Active" : "Expired")
                    .FirstOrDefault() ?? "NotEnrolled",
            })
            .ToListAsync();

        return rows.Select(l => new CallCenterStudentLectureDto
        {
            LectureId = l.Id,
            LectureTitle = l.Title,
            CourseId = l.CourseId,
            CourseTitle = l.CourseTitle,
            Order = l.Order,
            IsCurrent = l.IsCurrent,
            Attended = l.Attended,
            WatchedOnline = l.WatchedOnline,
            QuizScore = l.QuizScore,
            QuizFullMark = l.QuizFullMark,
            OnlineQuizCorrect = l.OnlineTotal > 0 ? l.OnlineCorrect : null,
            OnlineQuizTotal = l.OnlineTotal > 0 ? l.OnlineTotal : null,
            HomeworkScore = l.HomeworkScore,
            HomeworkFullMark = l.HomeworkFullMark,
            EnrollmentStatus = l.EnrollmentStatus,
        }).ToList();
    }

    public async IAsyncEnumerable<IEnumerable<ExportCallCenterStudentRow>> ExportStudentsAsync(
        ExportCallCenterStudentsQuery query)
    {
        var lecture = await LoadLectureAsync(query.CourseId, query.LectureId);
        var studentsQuery = BuildStudentsQuery(
            lecture,
            query.LectureId,
            query.Search,
            query.Called,
            query.Absent,
            query.Online,
            query.HasCredit);

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

            var watchedOnlineIds = await GetWatchedOnlineStudentIdsAsync(
                query.LectureId,
                students.Select(s => s.Id));

            yield return students.Select(student =>
            {
                contacts.TryGetValue(student.Id, out var contact);
                var dto = MapStudent(student, lecture, contact, watchedOnlineIds.Contains(student.Id));
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

    private async Task<Student> LoadStudentForLectureAsync(Lecture lecture, Guid lectureId, Guid studentId)
    {
        return await context.Set<Student>()
            .Include(x => x.LectureHomeworks.Where(h => h.LectureId == lectureId).Take(1))
            .Include(x => x.LectureQuizzes.Where(q => q.LectureId == lectureId).Take(1))
            .Include(x => x.LectureAttendances.Where(a => a.LectureId == lectureId).Take(1))
            .Include(x => x.QuizSubmissions.Where(s => s.Quiz.LectureId == lectureId))
                .ThenInclude(s => s.Quiz)
            .FirstOrDefaultAsync(x => x.Id == studentId && x.Level == lecture.Course.Level)
            ?? throw new ApiException(CallCenterErrors.StudentNotFound);
    }

    private async Task<CallCenterContact> GetOrCreateContactAsync(Guid lectureId, Guid studentId)
    {
        var contact = await context.Set<CallCenterContact>()
            .FirstOrDefaultAsync(c => c.LectureId == lectureId && c.StudentId == studentId);

        if (contact is not null)
            return contact;

        contact = new CallCenterContact
        {
            LectureId = lectureId,
            StudentId = studentId,
        };
        context.Add(contact);
        return contact;
    }

    private async Task<string> ResolveActorNameAsync(Guid actorId, UserRole role)
    {
        if (role == UserRole.Teacher)
            return "Teacher";

        var assistantName = await context.Set<Assistant>()
            .AsNoTracking()
            .Where(a => a.Id == actorId)
            .Select(a => a.FullName)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(assistantName))
            return assistantName.Trim();

        var email = await context.Set<Account>()
            .AsNoTracking()
            .Where(a => a.Id == actorId)
            .Select(a => a.Email)
            .FirstOrDefaultAsync();

        return string.IsNullOrWhiteSpace(email) ? "Assistant" : email;
    }

    private static CallCenterHistoryEvent CreateHistory(
        Guid lectureId,
        Guid studentId,
        Guid actorId,
        string actorName,
        CallCenterHistoryAction action,
        string? comment)
    {
        return new CallCenterHistoryEvent
        {
            Id = Guid.NewGuid(),
            LectureId = lectureId,
            StudentId = studentId,
            ActorId = actorId,
            ActorName = actorName,
            Action = action,
            Comment = comment,
            CreatedAt = DateTime.UtcNow,
        };
    }

    private IQueryable<Student> BuildStudentsQuery(
        Lecture lecture,
        Guid lectureId,
        string? search,
        bool? called,
        bool? absent,
        bool? online,
        bool? hasCredit)
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
                !x.LectureAttendances.Any(a => a.LectureId == lectureId && a.AttendedAt != null)
                && !x.AttendedLessons.Any(l => l.LectureId == lectureId));
        }
        else if (absent == false)
        {
            studentsQuery = studentsQuery.Where(x =>
                x.LectureAttendances.Any(a => a.LectureId == lectureId && a.AttendedAt != null)
                || x.AttendedLessons.Any(l => l.LectureId == lectureId));
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

        if (online == true)
        {
            studentsQuery = studentsQuery.Where(x =>
                x.StudentCode.ToUpper().StartsWith("ONL-"));
        }
        else if (online == false)
        {
            studentsQuery = studentsQuery.Where(x =>
                !x.StudentCode.ToUpper().StartsWith("ONL-"));
        }

        if (hasCredit == true)
        {
            studentsQuery = studentsQuery.Where(x => x.Credit > 0);
        }
        else if (hasCredit == false)
        {
            studentsQuery = studentsQuery.Where(x => x.Credit == 0);
        }

        return studentsQuery;
    }

    private static bool IsOnlineStudent(string studentCode) =>
        !string.IsNullOrWhiteSpace(studentCode) &&
        studentCode.StartsWith("ONL-", StringComparison.OrdinalIgnoreCase);

    private static ExportCallCenterStudentRow ToExportRow(CallCenterStudentDto student)
    {
        static string Score(decimal? score, decimal? fullMark)
        {
            if (score is null) return "";
            return fullMark is null ? $"{score}" : $"{score}/{fullMark}";
        }

        static string FormatQuiz(CallCenterStudentDto s)
        {
            if (s.OnlineQuizTotal is > 0)
                return $"{s.OnlineQuizCorrect ?? 0}/{s.OnlineQuizTotal}";
            return Score(s.QuizScore, s.QuizFullMark);
        }

        return new ExportCallCenterStudentRow
        {
            StudentCode = student.StudentCode,
            FullName = student.FullName,
            ParentPhoneNumber = student.ParentPhoneNumber,
            StudentType = student.IsOnline ? "Online" : "Offline",
            Attendance = student.Attended
                ? "Present"
                : student.WatchedOnline
                    ? "Watched Online"
                    : "Absent",
            QuizScore = FormatQuiz(student),
            Homework = Score(student.HomeworkScore, student.HomeworkFullMark),
            Credit = student.Credit,
            Comment = student.Comment ?? "",
            Called = student.Called ? "Yes" : "No",
            CalledAt = student.CalledAt?.ToString("u") ?? "",
        };
    }

    private async Task<HashSet<Guid>> GetWatchedOnlineStudentIdsAsync(
        Guid lectureId,
        IEnumerable<Guid> studentIds)
    {
        var ids = studentIds.Distinct().ToList();
        if (ids.Count == 0)
            return [];

        var watched = await context.Set<LessonAttendance>()
            .AsNoTracking()
            .Where(a => ids.Contains(a.StudentId) && a.Lesson.LectureId == lectureId)
            .Select(a => a.StudentId)
            .Distinct()
            .ToListAsync();

        return watched.ToHashSet();
    }

    private async Task<bool> HasWatchedLectureOnlineAsync(Guid lectureId, Guid studentId)
    {
        return await context.Set<LessonAttendance>()
            .AsNoTracking()
            .AnyAsync(a => a.StudentId == studentId && a.Lesson.LectureId == lectureId);
    }

    private static CallCenterStudentDto MapStudent(
        Student student,
        Lecture lecture,
        CallCenterContact? contact,
        bool watchedOnline)
    {
        var attendance = student.LectureAttendances.FirstOrDefault(a => a.LectureId == lecture.Id);
        var onlineCorrect = student.QuizSubmissions.Sum(x => x.NumOfCorrect);
        var onlineTotal = student.QuizSubmissions.Sum(x => x.NumOfQuestions);

        return new CallCenterStudentDto
        {
            Id = student.Id,
            StudentCode = student.StudentCode,
            FullName = student.FullName,
            ParentPhoneNumber = student.ParentPhoneNumber,
            Attended = attendance is { AttendedAt: not null },
            WatchedOnline = watchedOnline,
            IsOnline = IsOnlineStudent(student.StudentCode),
            QuizScore = student.LectureQuizzes.FirstOrDefault(q => q.LectureId == lecture.Id)?.Score,
            QuizFullMark = lecture.QuizFullMark,
            OnlineQuizCorrect = onlineTotal > 0 ? onlineCorrect : null,
            OnlineQuizTotal = onlineTotal > 0 ? onlineTotal : null,
            HomeworkScore = student.LectureHomeworks.FirstOrDefault(h => h.LectureId == lecture.Id)?.Score,
            HomeworkFullMark = lecture.HomeworkFullMark,
            Comment = contact?.Comment,
            Called = contact?.Called ?? false,
            CalledAt = contact?.CalledAt,
            Credit = student.Credit,
        };
    }
}
