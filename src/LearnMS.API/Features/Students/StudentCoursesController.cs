using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Students.Dtos;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Students;

[Tags("Students")]
[Route("api/students/courses")]
public class StudentCoursesController(ICurrentUserService currentUserService, AppDbContext context) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = nameof(GetStudentCourses))]
    public async Task<ApiWrapper.Success<List<StudentCourseDto>>> GetStudentCourses(
        StudentLevel? level)
    {
        CurrentUser? user = await currentUserService.GetUserAsync();
        var result = await context.Courses
            .Where(c => c.IsPublished && (level == null || c.Level == level))
            .OrderBy(c => c.Level)
            .ThenBy(c => c.Title)
            .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.ImageUrl,
                    c.Price,
                    c.RenewalPrice,
                    c.Level,
                    LecturesCount = c.Lectures.Count(l => l.IsPublished),
                    c.ExpirationDays,
                    ExamsCount = c.Exams.Count,
                    Enrollment = user == null
                        ? null
                        : c.CourseEnrollments
                            .Where(es => es.StudentId == user.Id)
                            .OrderByDescending(es => es.ExpiresAt)
                            .FirstOrDefault()
                }
            )
            .ToListAsync();

        List<StudentCourseDto> courses = result.Select(c => new StudentCourseDto(
            c.Id,
            c.Title,
            c.Description!,
            c.ImageUrl!,
            c.Price ?? 0,
            c.RenewalPrice ?? 0,
            c.Level ?? StudentLevel.Level0,
            c.LecturesCount,
            c.ExamsCount,
            c.ExpirationDays,
            c.Enrollment?.ExpiresAt
        )).ToList();

        return new ApiWrapper.Success<List<StudentCourseDto>>()
        {
            Data = courses
        };
    }

    [HttpGet("{courseId:guid}")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = nameof(GetStudentCourseDetails))]
    public async Task<ApiWrapper.Success<StudentCourseDetailsDto>> GetStudentCourseDetails(
        Guid courseId)
    {
        CurrentUser? user = await currentUserService.GetUserAsync();

        var course = await context.Courses
            .AsNoTracking()
            .Where(c => c.IsPublished && c.Id == courseId)
            .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.ImageUrl,
                    c.Price,
                    c.RenewalPrice,
                    c.Level,
                    c.ExpirationDays,
                    Lectures = c.Lectures
                        .Where(l => l.IsPublished)
                        .Select(l => new
                        {
                            l.Id,
                            l.Title,
                            l.Description,
                            l.Order,
                            l.ExpirationDays,
                            l.Price,
                            l.RenewalPrice,
                            l.ImageUrl,
                            l.HomeworkVideoUrl,
                            Assets = l.Assets.Select(a => new StudentAssetDto()
                            {
                                Id = a.Id,
                                Name = a.Name,
                                Type = a.Type,
                                Url = a.Url
                            }).ToList(),
                            Lessons = l.Lessons
                                .Select(ls => new StudentLessonDto()
                                {
                                    Id = ls.Id,
                                    Title = ls.Title,
                                    Description = ls.Description,
                                    Order = ls.Order,
                                    RenewalPrice = ls.RenewalPrice
                                })
                                .ToList(),
                            Quizzes = l.Quizzes
                                .Select(q => new StudentQuizDto()
                                {
                                    Id = q.Id,
                                    Title = q.Title,
                                    Description = q.Description,
                                    Order = q.Order,
                                    QuestionsCount = q.Questions.Count,
                                    IsSubmitted = user != null && q.QuizSubmissions.Any(s => s.StudentId == user.Id),
                                    NumOfCorrect = user == null
                                        ? null
                                        : q.QuizSubmissions
                                            .Where(s => s.StudentId == user.Id)
                                            .Select(s => (int?)s.NumOfCorrect)
                                            .FirstOrDefault(),
                                    NumOfQuestions = user == null
                                        ? null
                                        : q.QuizSubmissions
                                            .Where(s => s.StudentId == user.Id)
                                            .Select(s => (int?)s.NumOfQuestions)
                                            .FirstOrDefault(),
                                    PassCount = q.PassCount,
                                    IsPassed = user == null
                                        ? null
                                        : q.QuizSubmissions
                                            .Where(s => s.StudentId == user.Id)
                                            .Select(s => (bool?)(s.NumOfCorrect >= q.PassCount))
                                            .FirstOrDefault(),
                                })
                                .ToList(),
                        }),
                    Exams = c.Exams
                        .Select(e => new StudentExamDto()
                        {
                            Id = e.Id,
                            Title = e.Title,
                            Description = e.Description,
                            Order = e.Order,
                            QuestionsCount = e.Questions.Count,
                            Price = e.Price,
                            RetakePrice = e.RetakePrice,
                            ExpiryHours = e.ExpiryHours,
                            IsPurchased = user != null && e.ExamEnrollments.Any(en => en.StudentId == user.Id),
                            IsSubmitted = user != null && e.ExamEnrollments
                                .Any(en => en.StudentId == user.Id && en.Submission != null),
                            ExpiresAt = user == null
                                ? null
                                : e.ExamEnrollments
                                    .Where(en => en.StudentId == user.Id)
                                    .Select(en => (DateTime?)en.ExpiresAt)
                                    .FirstOrDefault(),
                        })
                        .ToList()
                }
            )
            .FirstOrDefaultAsync();

        if (course is null)
        {
            throw new ApiException(CoursesErrors.NotFound);
        }

        DateTime? courseExpires = null;
        Dictionary<Guid, DateTime?> lectureExpiresById = new();
        HashSet<Guid> paidLectureIds = [];
        if (user != null)
        {
            var studentId = await context.Students
                .AsNoTracking()
                .Where(s => s.Id == user.Id || s.Accounts.Any(a => a.Id == user.Id))
                .Select(s => (Guid?)s.Id)
                .FirstOrDefaultAsync() ?? user.Id;

            courseExpires = await context.Set<CourseEnrollment>()
                .AsNoTracking()
                .Where(e => (e.StudentId == studentId || e.StudentId == user.Id) && e.CourseId == courseId)
                .Select(e => (DateTime?)e.ExpiresAt)
                .FirstOrDefaultAsync();

            var lectureIds = course.Lectures.Select(l => l.Id).ToList();
            var lectureEnrollmentRows = await context.Set<LectureEnrollment>()
                .AsNoTracking()
                .Where(e =>
                    (e.StudentId == studentId || e.StudentId == user.Id)
                    && lectureIds.Contains(e.LectureId))
                .Select(e => new { e.LectureId, e.ExpiresAt })
                .ToListAsync();
            lectureExpiresById = lectureEnrollmentRows
                .GroupBy(e => e.LectureId)
                .ToDictionary(
                    g => g.Key,
                    g => (DateTime?)g.OrderByDescending(e => e.ExpiresAt).First().ExpiresAt
                );

            foreach (var id in lectureExpiresById.Keys)
                paidLectureIds.Add(id);

            var lessonIdToLectureId = course.Lectures
                .SelectMany(l => l.Lessons.Select(ls => (LessonId: ls.Id, LectureId: l.Id)))
                .ToDictionary(x => x.LessonId, x => x.LectureId);
            var lessonIds = lessonIdToLectureId.Keys.ToList();
            if (lessonIds.Count > 0)
            {
                var watchedLessonIds = await context.Set<LessonAttendance>()
                    .AsNoTracking()
                    .Where(a =>
                        (a.StudentId == studentId || a.StudentId == user.Id)
                        && lessonIds.Contains(a.LessonId))
                    .Select(a => a.LessonId)
                    .ToListAsync();
                foreach (var lessonId in watchedLessonIds)
                {
                    if (lessonIdToLectureId.TryGetValue(lessonId, out var watchedLectureId))
                        paidLectureIds.Add(watchedLectureId);
                }
            }

            var purchaseMessages = await context.Set<StudentEvent>()
                .AsNoTracking()
                .Where(e => e.StudentId == studentId || e.StudentId == user.Id)
                .Select(e => e.Message)
                .ToListAsync();
            foreach (var lecture in course.Lectures)
            {
                if (purchaseMessages.Any(m => EnrollmentRules.IndicatesLecturePurchase(m, lecture.Title)))
                    paidLectureIds.Add(lecture.Id);
            }

            var missingIds = paidLectureIds.Where(id => !lectureExpiresById.ContainsKey(id)).ToList();
            if (missingIds.Count > 0)
            {
                var lifetime = DateTime.UtcNow.AddYears(50);
                foreach (var lectureId in missingIds)
                {
                    context.Set<LectureEnrollment>().Add(new LectureEnrollment
                    {
                        StudentId = studentId,
                        LectureId = lectureId,
                        ExpiresAt = lifetime,
                        EnrolledAt = DateTime.UtcNow
                    });
                    lectureExpiresById[lectureId] = lifetime;
                }

                try
                {
                    await context.SaveChangesAsync();
                }
                catch
                {
                    // Another request may have already written the missing rows.
                }
            }
        }

        var hasActiveCourseEnrollment =
            EnrollmentRules.IsActive(courseExpires, course.ExpirationDays);

        List<StudentLectureDto> lectures = course.Lectures.Select(l =>
        {
            lectureExpiresById.TryGetValue(l.Id, out var lectureExpires);
            var alreadyPaid = paidLectureIds.Contains(l.Id);
            DateTime? expiresAt;
            if (hasActiveCourseEnrollment)
                expiresAt = EnrollmentRules.EffectiveExpiresAt(courseExpires, course.ExpirationDays);
            else if (alreadyPaid)
                expiresAt = EnrollmentRules.EffectiveExpiresAt(lectureExpires, l.ExpirationDays)
                    ?? DateTime.UtcNow.AddYears(50);
            else
                expiresAt = EnrollmentRules.EffectiveExpiresAt(courseExpires, course.ExpirationDays);

            return new StudentLectureDto()
            {
                Id = l.Id,
                Title = l.Title,
                Description = l.Description,
                Price = l.Price ?? 0,
                RenewalPrice = l.RenewalPrice ?? 0,
                Order = l.Order,
                ImageUrl = l.ImageUrl,
                HomeworkVideoUrl = l.HomeworkVideoUrl,
                Assets = l.Assets,
                ExpirationDays = l.ExpirationDays,
                Items = l.Lessons.Cast<StudentLectureItemDto>().Union(l.Quizzes).OrderBy(i => i.Order).ToList(),
                ExpiresAt = expiresAt,
                Enrollment = alreadyPaid || hasActiveCourseEnrollment
                    ? Enrollment.Active
                    : EnrollmentRules.ToStatus(expiresAt, l.ExpirationDays),
            };
        }).ToList();

        var courseDto = new StudentCourseDetailsDto()
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description!,
            ImageUrl = course.ImageUrl!,
            Price = course.Price ?? 0,
            RenewalPrice = course.RenewalPrice ?? 0,
            Level = course.Level ?? StudentLevel.Level0,
            ExpiresAt = courseExpires,
            ExpirationDays = course.ExpirationDays,
            Items = lectures
                .Cast<StudentCourseItemDto>()
                .Union(course.Exams)
                .OrderBy(i => i.Order)
                .ToList(),
        };


        return new ApiWrapper.Success<StudentCourseDetailsDto>()
        {
            Data = courseDto,
        };
    }
}