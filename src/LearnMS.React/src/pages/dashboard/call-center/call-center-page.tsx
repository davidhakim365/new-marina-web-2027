import {
  CallCenterStudent,
  openCallCenterWhatsApp,
  useCallCenterStudentsQuery,
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
import { StudentLevel } from "@/generated/model";
import {
  ADMIN_LEVEL_I18N_KEYS,
  STUDENT_LEVEL_ORDER,
} from "@/lib/student-levels";
import { cn, toast } from "@/lib/utils";
import { PaginationState } from "@tanstack/react-table";
import useDownloadFile from "@/hooks/useDownloadFile";
import {
  CheckCircle2,
  Download,
  Loader2,
  MessageCircle,
  Phone,
  Search,
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

function RatioText({
  correct,
  total,
  pending,
}: {
  correct?: number | null;
  total?: number | null;
  pending?: number | null;
}) {
  if (total == null)
    return <span className="text-muted-foreground">—</span>;
  return (
    <span className="font-medium tabular-nums">
      {correct ?? 0}/{total}
      {pending ? (
        <span className="ms-1 text-xs text-amber-600">({pending})</span>
      ) : null}
    </span>
  );
}

function StudentCallCard({
  student,
  courseId,
  lectureId,
  courseTitle,
  lectureTitle,
}: {
  student: CallCenterStudent;
  courseId: string;
  lectureId: string;
  courseTitle?: string;
  lectureTitle?: string;
}) {
  const { t, i18n } = useTranslation();
  const updateMutation = useUpdateCallCenterContact();
  const [comment, setComment] = useState(student.comment ?? "");

  useEffect(() => {
    setComment(student.comment ?? "");
  }, [student.comment, student.id]);

  const locale = i18n.language.startsWith("ar") ? "ar" : "en";

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
      locale,
    });
    if (!opened) {
      toast({
        title: t("admin.callCenter.invalidPhone"),
        description: t("admin.callCenter.invalidPhoneDesc"),
        variant: "destructive",
      });
      return;
    }
    const nextComment = comment.trim();
    const prevComment = (student.comment ?? "").trim();
    if (nextComment !== prevComment) {
      updateMutation.mutate({
        courseId,
        lectureId,
        studentId: student.id,
        comment: nextComment,
        called: student.called ? undefined : true,
      });
    } else if (!student.called) {
      toggleCalled(true);
    }
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
            {student.attended ? (
              <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("admin.callCenter.present")}
              </Badge>
            ) : (
              <Badge className="gap-1 bg-rose-500/15 text-rose-700 hover:bg-rose-500/20">
                <XCircle className="h-3.5 w-3.5" />
                {t("admin.callCenter.absent")}
              </Badge>
            )}
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
              disabled={updateMutation.isPending}
              onCheckedChange={(v) => toggleCalled(v === true)}
            />
            {t("admin.callCenter.called")}
          </label>
          <Button
            type="button"
            size="sm"
            className="gap-2 bg-[#25D366] text-white hover:bg-[#1fb855]"
            onClick={notify}
            disabled={!student.parentPhoneNumber}
          >
            <MessageCircle className="h-4 w-4" />
            {t("admin.callCenter.notify")}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.callCenter.quiz")}
          </p>
          <ScoreText score={student.quizScore} fullMark={student.quizFullMark} />
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.callCenter.homeworkChoose")}
          </p>
          <RatioText
            correct={student.chooseCorrect}
            total={student.chooseTotal}
          />
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.callCenter.homeworkEssay")}
          </p>
          <RatioText
            correct={student.essayCorrect}
            total={student.essayTotal}
            pending={student.essayPending}
          />
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.callCenter.offlineHomework")}
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
          disabled={updateMutation.isPending}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              updateMutation.isPending ||
              comment.trim() === (student.comment ?? "").trim()
            }
            onClick={saveComment}
          >
            {t("admin.callCenter.saveComment")}
          </Button>
        </div>
      </div>
    </div>
  );
}

const CallCenterPage = () => {
  const { t } = useTranslation();
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
