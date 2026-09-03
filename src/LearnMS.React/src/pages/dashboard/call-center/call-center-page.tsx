import {
  CallCenterHistoryAction,
  CallCenterStudent,
  CallCenterStudentLecture,
  formatCallCenterQuizScore,
  openCallCenterWhatsApp,
  useCallCenterHistoryQuery,
  useCallCenterStudentLecturesQuery,
  useCallCenterStudentsQuery,
  useLogCallCenterNotify,
  useUpdateCallCenterContact,
} from "@/api/call-center-api";
import { useCoursesQuery } from "@/api/courses-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetCourse } from "@/generated/api";
import { Permission, StudentLevel } from "@/generated/model";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import {
  ADMIN_LEVEL_I18N_KEYS,
  STUDENT_LEVEL_ORDER,
} from "@/lib/student-levels";
import { cn, toast } from "@/lib/utils";
import { PaginationState } from "@tanstack/react-table";
import useDownloadFile from "@/hooks/useDownloadFile";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Globe,
  History,
  Loader2,
  MessageCircle,
  Phone,
  PlayCircle,
  Search,
  BookOpen,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

function ScoreText({
  score,
  fullMark,
}: {
  score?: number | null;
  fullMark?: number | null;
}) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  if (fullMark != null)
    return (
      <span className="font-medium tabular-nums">
        {score}/{fullMark}
      </span>
    );
  return <span className="font-medium tabular-nums">{score}</span>;
}

function QuizScoreText({ student }: { student: CallCenterStudent }) {
  const value = formatCallCenterQuizScore(student);
  if (value === "—")
    return <span className="text-muted-foreground">—</span>;
  return <span className="font-medium tabular-nums">{value}</span>;
}

function AttendanceBadge({
  attended,
  watchedOnline,
}: {
  attended: boolean;
  watchedOnline?: boolean;
}) {
  const { t } = useTranslation();

  if (attended) {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("admin.callCenter.present")}
      </Badge>
    );
  }

  if (watchedOnline) {
    return (
      <Badge className="gap-1 bg-sky-500/15 text-sky-700 hover:bg-sky-500/20">
        <PlayCircle className="h-3.5 w-3.5" />
        {t("admin.callCenter.watchedOnline")}
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 bg-rose-500/15 text-rose-700 hover:bg-rose-500/20">
      <XCircle className="h-3.5 w-3.5" />
      {t("admin.callCenter.absent")}
    </Badge>
  );
}

function historyActionLabel(
  action: CallCenterHistoryAction,
  t: (key: string) => string
) {
  switch (action) {
    case "Called":
      return t("admin.callCenter.historyAction.called");
    case "Uncalled":
      return t("admin.callCenter.historyAction.uncalled");
    case "Comment":
      return t("admin.callCenter.historyAction.comment");
    case "Notify":
      return t("admin.callCenter.historyAction.notify");
    default:
      return action;
  }
}

function enrollmentStatusLabel(
  status: CallCenterStudentLecture["enrollmentStatus"],
  t: (key: string) => string
) {
  switch (status) {
    case "Active":
      return t("admin.callCenter.enrolled");
    case "Expired":
      return t("admin.callCenter.expired");
    default:
      return t("admin.callCenter.notEnrolled");
  }
}

function StudentLectureHistory({
  courseId,
  lectureId,
  studentId,
}: {
  courseId: string;
  lectureId: string;
  studentId: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const lecturesQuery = useCallCenterStudentLecturesQuery(
    courseId,
    lectureId,
    studentId,
    open
  );

  const grouped = useMemo(() => {
    const items = lecturesQuery.data?.data ?? [];
    const groups: { courseTitle: string; lectures: CallCenterStudentLecture[] }[] =
      [];
    for (const item of items) {
      const last = groups[groups.length - 1];
      if (last && last.courseTitle === item.courseTitle) {
        last.lectures.push(item);
      } else {
        groups.push({ courseTitle: item.courseTitle, lectures: [item] });
      }
    }
    return groups;
  }, [lecturesQuery.data]);

  return (
    <div className="mt-3 rounded-lg border border-color2/10 bg-muted/20">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-color2" />
          {t("admin.callCenter.lectureHistoryTitle")}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-color2/10 px-3 py-3">
          {lecturesQuery.isLoading ? (
            <Loading />
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("admin.callCenter.lectureHistoryEmpty")}
            </p>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.courseTitle} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.courseTitle}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-start text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="pb-2 pe-3 font-medium">
                            {t("admin.callCenter.lectures")}
                          </th>
                          <th className="pb-2 pe-3 font-medium">
                            {t("admin.callCenter.attendance")}
                          </th>
                          <th className="pb-2 pe-3 font-medium">
                            {t("admin.callCenter.quiz")}
                          </th>
                          <th className="pb-2 pe-3 font-medium">
                            {t("admin.callCenter.homework")}
                          </th>
                          <th className="pb-2 font-medium">
                            {t("admin.callCenter.enrollment")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.lectures.map((item) => (
                          <tr
                            key={item.lectureId}
                            className={cn(
                              "border-t border-color2/10",
                              item.isCurrent && "bg-color2/5"
                            )}
                          >
                            <td className="py-2 pe-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium">
                                  {item.lectureTitle}
                                </span>
                                {item.isCurrent ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {t("admin.callCenter.lectureHistoryCurrent")}
                                  </Badge>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-2 pe-3">
                              <AttendanceBadge
                                attended={item.attended}
                                watchedOnline={item.watchedOnline}
                              />
                            </td>
                            <td className="py-2 pe-3 tabular-nums">
                              {formatCallCenterQuizScore(item) === "—" ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                formatCallCenterQuizScore(item)
                              )}
                            </td>
                            <td className="py-2 pe-3">
                              <ScoreText
                                score={item.homeworkScore}
                                fullMark={item.homeworkFullMark}
                              />
                            </td>
                            <td className="py-2">
                              <span className="text-xs text-muted-foreground">
                                {enrollmentStatusLabel(item.enrollmentStatus, t)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentHistory({
  courseId,
  lectureId,
  studentId,
}: {
  courseId: string;
  lectureId: string;
  studentId: string;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const historyQuery = useCallCenterHistoryQuery(
    courseId,
    lectureId,
    studentId,
    open,
    { page: 1, pageSize: 30 }
  );

  const locale = i18n.language.startsWith("ar") ? "ar" : "en";

  return (
    <div className="mt-3 rounded-lg border border-color2/10 bg-muted/20">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4 text-color2" />
          {t("admin.callCenter.historyTitle")}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-color2/10 px-3 py-3">
          {historyQuery.isLoading ? (
            <Loading />
          ) : (historyQuery.data?.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("admin.callCenter.historyEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {historyQuery.data!.data!.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md bg-background/70 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {historyActionLabel(item.action, t)}
                    </Badge>
                    <span className="font-medium">{item.actorName}</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {new Date(item.createdAt).toLocaleString(
                        locale === "ar" ? "ar-EG" : "en-GB"
                      )}
                    </span>
                  </div>
                  {item.comment ? (
                    <p className="mt-1 text-muted-foreground">{item.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StudentCallCard({
  student,
  courseId,
  lectureId,
  courseTitle,
  lectureTitle,
  canViewHistory,
}: {
  student: CallCenterStudent;
  courseId: string;
  lectureId: string;
  courseTitle?: string;
  lectureTitle?: string;
  canViewHistory: boolean;
}) {
  const { t } = useTranslation();
  const updateMutation = useUpdateCallCenterContact();
  const notifyMutation = useLogCallCenterNotify();
  const [comment, setComment] = useState(student.comment ?? "");

  useEffect(() => {
    setComment(student.comment ?? "");
  }, [student.comment, student.id]);

  const busy = updateMutation.isPending || notifyMutation.isPending;

  const saveComment = () => {
    const next = comment.trim();
    const prev = (student.comment ?? "").trim();
    if (next === prev) return;

    updateMutation.mutate(
      {
        courseId,
        lectureId,
        studentId: student.id,
        comment: next,
      },
      {
        onSuccess: () => {
          toast({
            title: t("admin.callCenter.saved"),
            description: t("admin.callCenter.commentSaved"),
          });
        },
      }
    );
  };

  const toggleCalled = (called: boolean) => {
    updateMutation.mutate(
      {
        courseId,
        lectureId,
        studentId: student.id,
        called,
      },
      {
        onSuccess: () => {
          toast({
            title: t("admin.callCenter.saved"),
            description: called
              ? t("admin.callCenter.markedCalled")
              : t("admin.callCenter.markedNotCalled"),
          });
        },
      }
    );
  };

  const notify = () => {
    const snapshot: CallCenterStudent = {
      ...student,
      comment: comment.trim() || student.comment,
    };
    const opened = openCallCenterWhatsApp(snapshot, {
      courseTitle,
      lectureTitle,
    });
    if (!opened) {
      toast({
        title: t("admin.callCenter.invalidPhone"),
        description: t("admin.callCenter.invalidPhoneDesc"),
        variant: "destructive",
      });
      return;
    }

    notifyMutation.mutate(
      {
        courseId,
        lectureId,
        studentId: student.id,
        comment: comment.trim(),
        markCalled: false,
      },
      {
        onSuccess: () => {
          toast({
            title: t("admin.callCenter.saved"),
            description: t("admin.callCenter.notifyLogged"),
          });
        },
      }
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-color2/15 bg-background/60 p-4 transition",
        student.called && "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">
              {student.fullName}
            </h3>
            <Badge variant="secondary" className="tabular-nums">
              {student.studentCode}
            </Badge>
            <AttendanceBadge
              attended={student.attended}
              watchedOnline={student.watchedOnline}
            />
            {student.isOnline ? (
              <Badge className="gap-1 bg-sky-500/15 text-sky-700 hover:bg-sky-500/20">
                <Globe className="h-3.5 w-3.5" />
                {t("admin.callCenter.online")}
              </Badge>
            ) : (
              <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
                {t("admin.callCenter.offline")}
              </Badge>
            )}
            <Badge
              className={cn(
                "gap-1",
                (student.credit ?? 0) > 0
                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"
                  : "bg-rose-500/15 text-rose-700 hover:bg-rose-500/20"
              )}
            >
              <Wallet className="h-3.5 w-3.5" />
              {t("admin.callCenter.credit")}: {student.credit ?? 0}
            </Badge>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span className="tabular-nums" dir="ltr">
              {student.parentPhoneNumber || "—"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-color2/15 px-3 py-2 text-sm">
            <Checkbox
              checked={student.called}
              disabled={busy}
              onCheckedChange={(v) => toggleCalled(v === true)}
            />
            {t("admin.callCenter.called")}
          </label>
          <Button
            type="button"
            size="sm"
            className="gap-2 bg-[#25D366] text-white hover:bg-[#1fb855]"
            onClick={notify}
            disabled={!student.parentPhoneNumber || busy}
          >
            {notifyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {t("admin.callCenter.notify")}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.callCenter.quiz")}
          </p>
          <QuizScoreText student={student} />
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.callCenter.homework")}
          </p>
          <ScoreText
            score={student.homeworkScore}
            fullMark={student.homeworkFullMark}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("admin.callCenter.commentPlaceholder")}
          className="min-h-[72px] resize-y"
          disabled={busy}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              busy || comment.trim() === (student.comment ?? "").trim()
            }
            onClick={saveComment}
          >
            {t("admin.callCenter.saveComment")}
          </Button>
        </div>
      </div>

      <StudentLectureHistory
        courseId={courseId}
        lectureId={lectureId}
        studentId={student.id}
      />

      {canViewHistory && (
        <StudentHistory
          courseId={courseId}
          lectureId={lectureId}
          studentId={student.id}
        />
      )}
    </div>
  );
}

const CallCenterPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useDashboardPermissions();
  const canViewHistory = hasPermission(Permission.ViewCallCenterHistory);
  const { download, isDownloading } = useDownloadFile();
  const [level, setLevel] = useState<StudentLevel | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>();
  const [lectureId, setLectureId] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<
    "all" | "absent" | "present"
  >("all");
  const [calledFilter, setCalledFilter] = useState<"all" | "called" | "notCalled">(
    "all"
  );
  const [modeFilter, setModeFilter] = useState<"all" | "online" | "offline">(
    "all"
  );
  const [creditFilter, setCreditFilter] = useState<"all" | "zero" | "hasCredit">(
    "all"
  );
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const calledQueryParam =
    calledFilter === "called"
      ? true
      : calledFilter === "notCalled"
        ? false
        : undefined;
  const absentQueryParam =
    attendanceFilter === "absent"
      ? true
      : attendanceFilter === "present"
        ? false
        : undefined;
  const onlineQueryParam =
    modeFilter === "online"
      ? true
      : modeFilter === "offline"
        ? false
        : undefined;
  const hasCreditQueryParam =
    creditFilter === "hasCredit"
      ? true
      : creditFilter === "zero"
        ? false
        : undefined;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: coursesData, isLoading: coursesLoading } = useCoursesQuery();
  const { data: courseData, isLoading: lecturesLoading } = useGetCourse(
    courseId as string,
    { query: { enabled: !!courseId } }
  );

  const courses = useMemo(
    () =>
      (coursesData?.data?.items ?? []).filter(
        (item) => !level || item.level === level
      ),
    [coursesData, level]
  );

  const lectures = useMemo(
    () =>
      (courseData?.data?.items ?? []).filter((item) => item.type === "Lecture"),
    [courseData]
  );

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedLecture = lectures.find((l) => l.id === lectureId);

  const studentsQuery = useCallCenterStudentsQuery(courseId, lectureId, {
    page: pageIndex + 1,
    pageSize,
    search: debouncedSearch || undefined,
    absent: absentQueryParam,
    called: calledQueryParam,
    online: onlineQueryParam,
    hasCredit: hasCreditQueryParam,
  });

  const totalCount = studentsQuery.data?.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const onExport = async () => {
    if (!courseId || !lectureId) return;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (calledQueryParam !== undefined)
      params.set("called", String(calledQueryParam));
    if (absentQueryParam !== undefined)
      params.set("absent", String(absentQueryParam));
    if (onlineQueryParam !== undefined)
      params.set("online", String(onlineQueryParam));
    if (hasCreditQueryParam !== undefined)
      params.set("hasCredit", String(hasCreditQueryParam));
    const qs = params.toString();
    const safeTitle = (selectedLecture?.title || "lecture")
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 40);
    await download(
      `/api/call-center/courses/${courseId}/lectures/${lectureId}/students/export${
        qs ? `?${qs}` : ""
      }`,
      `call-center-${safeTitle}.csv`
    );
  };

  if (coursesLoading) return <Loading />;

  return (
    <DashboardPageShell
      title={t("admin.callCenter.title")}
      description={t("admin.callCenter.description")}
      icon={Phone}
      fullWidth
      actions={
        lectureId && courseId ? (
          <Button
            variant="outline"
            disabled={isDownloading}
            onClick={onExport}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("admin.callCenter.export")}
          </Button>
        ) : undefined
      }
    >
      <DashboardCard>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Select
            value={level}
            onValueChange={(value) => {
              setLevel(value as StudentLevel);
              setCourseId(undefined);
              setLectureId(undefined);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("admin.callCenter.selectLevel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t("admin.callCenter.levels")}</SelectLabel>
                {STUDENT_LEVEL_ORDER.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {t(ADMIN_LEVEL_I18N_KEYS[lvl])}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {level && (
            <Select
              value={courseId}
              onValueChange={(value) => {
                setCourseId(value);
                setLectureId(undefined);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder={t("admin.callCenter.selectCourse")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("admin.callCenter.courses")}</SelectLabel>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          {courseId && (
            <Select
              value={lectureId}
              onValueChange={(value) => {
                setLectureId(value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              disabled={lecturesLoading}
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue
                  placeholder={t("admin.callCenter.selectLecture")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("admin.callCenter.lectures")}</SelectLabel>
                  {lectures.map((lecture) => (
                    <SelectItem key={lecture.id} value={lecture.id}>
                      {lecture.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </DashboardCard>

      {lectureId && courseId && (
        <DashboardCard>
          <div className="mb-4 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  placeholder={t("admin.callCenter.searchPlaceholder")}
                  className="ps-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={modeFilter}
                  onValueChange={(v) => {
                    setModeFilter(v as typeof modeFilter);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("admin.callCenter.filterAllModes")}
                    </SelectItem>
                    <SelectItem value="online">
                      {t("admin.callCenter.filterOnline")}
                    </SelectItem>
                    <SelectItem value="offline">
                      {t("admin.callCenter.filterOffline")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={attendanceFilter}
                  onValueChange={(v) => {
                    setAttendanceFilter(v as typeof attendanceFilter);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("admin.callCenter.filterAllAttendance")}
                    </SelectItem>
                    <SelectItem value="absent">
                      {t("admin.callCenter.filterAbsent")}
                    </SelectItem>
                    <SelectItem value="present">
                      {t("admin.callCenter.filterPresent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={creditFilter}
                  onValueChange={(v) => {
                    setCreditFilter(v as typeof creditFilter);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("admin.callCenter.filterAllCredit")}
                    </SelectItem>
                    <SelectItem value="zero">
                      {t("admin.callCenter.filterZeroCredit")}
                    </SelectItem>
                    <SelectItem value="hasCredit">
                      {t("admin.callCenter.filterHasCredit")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDownloading}
                  onClick={onExport}
                  className="gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t("admin.callCenter.export")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("admin.callCenter.calledFilterLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", t("admin.callCenter.filterAllCalls")],
                    ["called", t("admin.callCenter.filterCalled")],
                    ["notCalled", t("admin.callCenter.filterNotCalled")],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={calledFilter === value ? "default" : "outline"}
                    className={cn(
                      calledFilter === value &&
                        "bg-gradient-to-r from-color1 to-color2 text-white"
                    )}
                    onClick={() => {
                      setCalledFilter(value);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {studentsQuery.isLoading ? (
            <Loading />
          ) : (studentsQuery.data?.data?.items.length ?? 0) === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("admin.callCenter.empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {studentsQuery.data!.data!.items.map((student) => (
                <StudentCallCard
                  key={student.id}
                  student={student}
                  courseId={courseId}
                  lectureId={lectureId}
                  courseTitle={selectedCourse?.title}
                  lectureTitle={selectedLecture?.title}
                  canViewHistory={canViewHistory}
                />
              ))}
            </div>
          )}

          {totalCount > pageSize && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {t("admin.callCenter.pageInfo", {
                  page: pageIndex + 1,
                  total: totalPages,
                  count: totalCount,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageIndex === 0}
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: Math.max(0, p.pageIndex - 1),
                    }))
                  }
                >
                  {t("admin.callCenter.prev")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageIndex + 1 >= totalPages}
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      pageIndex: p.pageIndex + 1,
                    }))
                  }
                >
                  {t("admin.callCenter.next")}
                </Button>
              </div>
            </div>
          )}
        </DashboardCard>
      )}
    </DashboardPageShell>
  );
};

export default CallCenterPage;
