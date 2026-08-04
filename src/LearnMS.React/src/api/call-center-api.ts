import { api } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CallCenterStudent = {
  id: string;
  studentCode: string;
  fullName: string;
  parentPhoneNumber: string;
  attended: boolean;
  quizScore?: number | null;
  quizFullMark?: number | null;
  homeworkScore?: number | null;
  homeworkFullMark?: number | null;
  chooseCorrect?: number | null;
  chooseTotal?: number | null;
  essayCorrect?: number | null;
  essayTotal?: number | null;
  essayPending?: number | null;
  comment?: string | null;
  called: boolean;
  calledAt?: string | null;
};

export type CallCenterStudentsPage = {
  items: CallCenterStudent[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type CallCenterStudentsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  called?: boolean;
  absent?: boolean;
};

export function getCallCenterStudentsQueryKey(
  courseId: string,
  lectureId: string,
  params?: CallCenterStudentsParams
) {
  return ["/api/call-center/students", courseId, lectureId, params] as const;
}

export const getCallCenterStudents = (
  courseId: string,
  lectureId: string,
  params: CallCenterStudentsParams = {}
) =>
  api
    .get<ApiSuccess<CallCenterStudentsPage>>(
      `/api/call-center/courses/${courseId}/lectures/${lectureId}/students`,
      { params }
    )
    .then((res) => res.data);

export type CallCenterHistoryAction =
  | "Called"
  | "Uncalled"
  | "Comment"
  | "Notify";

export type CallCenterHistoryItem = {
  id: string;
  action: CallCenterHistoryAction;
  actorName: string;
  actorId: string;
  comment?: string | null;
  createdAt: string;
};

export type CallCenterHistoryPage = {
  items: CallCenterHistoryItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export const updateCallCenterContact = (
  courseId: string,
  lectureId: string,
  studentId: string,
  body: { comment?: string | null; called?: boolean }
) =>
  api
    .patch<ApiSuccess<CallCenterStudent>>(
      `/api/call-center/courses/${courseId}/lectures/${lectureId}/students/${studentId}`,
      body
    )
    .then((res) => res.data);

export const logCallCenterNotify = (
  courseId: string,
  lectureId: string,
  studentId: string,
  body: { comment?: string | null; markCalled?: boolean } = {}
) =>
  api
    .post<ApiSuccess<CallCenterStudent>>(
      `/api/call-center/courses/${courseId}/lectures/${lectureId}/students/${studentId}/notify`,
      body
    )
    .then((res) => res.data);

export const getCallCenterHistory = (
  courseId: string,
  lectureId: string,
  studentId: string,
  params: { page?: number; pageSize?: number } = {}
) =>
  api
    .get<ApiSuccess<CallCenterHistoryPage>>(
      `/api/call-center/courses/${courseId}/lectures/${lectureId}/students/${studentId}/history`,
      { params }
    )
    .then((res) => res.data);

export function getCallCenterHistoryQueryKey(
  courseId: string,
  lectureId: string,
  studentId: string,
  params?: { page?: number; pageSize?: number }
) {
  return [
    "/api/call-center/history",
    courseId,
    lectureId,
    studentId,
    params,
  ] as const;
}

export function useCallCenterStudentsQuery(
  courseId: string | undefined,
  lectureId: string | undefined,
  params: CallCenterStudentsParams
) {
  return useQuery({
    queryKey: getCallCenterStudentsQueryKey(
      courseId ?? "",
      lectureId ?? "",
      params
    ),
    queryFn: () => getCallCenterStudents(courseId!, lectureId!, params),
    enabled: !!courseId && !!lectureId,
  });
}

function invalidateCallCenter(
  qc: ReturnType<typeof useQueryClient>,
  courseId: string,
  lectureId: string,
  studentId?: string
) {
  qc.invalidateQueries({
    queryKey: ["/api/call-center/students", courseId, lectureId],
  });
  if (studentId) {
    qc.invalidateQueries({
      queryKey: ["/api/call-center/history", courseId, lectureId, studentId],
    });
  }
}

export function useUpdateCallCenterContact() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      courseId: string;
      lectureId: string;
      studentId: string;
      comment?: string | null;
      called?: boolean;
    }) =>
      updateCallCenterContact(
        vars.courseId,
        vars.lectureId,
        vars.studentId,
        { comment: vars.comment, called: vars.called }
      ),
    onSuccess: (_, vars) => {
      invalidateCallCenter(qc, vars.courseId, vars.lectureId, vars.studentId);
    },
  });
}

export function useLogCallCenterNotify() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      courseId: string;
      lectureId: string;
      studentId: string;
      comment?: string | null;
      markCalled?: boolean;
    }) =>
      logCallCenterNotify(vars.courseId, vars.lectureId, vars.studentId, {
        comment: vars.comment,
        markCalled: vars.markCalled,
      }),
    onSuccess: (_, vars) => {
      invalidateCallCenter(qc, vars.courseId, vars.lectureId, vars.studentId);
    },
  });
}

export function useCallCenterHistoryQuery(
  courseId: string | undefined,
  lectureId: string | undefined,
  studentId: string | undefined,
  enabled: boolean,
  params: { page?: number; pageSize?: number } = { page: 1, pageSize: 20 }
) {
  return useQuery({
    queryKey: getCallCenterHistoryQueryKey(
      courseId ?? "",
      lectureId ?? "",
      studentId ?? "",
      params
    ),
    queryFn: () =>
      getCallCenterHistory(courseId!, lectureId!, studentId!, params),
    enabled: enabled && !!courseId && !!lectureId && !!studentId,
  });
}

/** Normalize Egyptian parent phones for wa.me / api.whatsapp.com */
export function toWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("0020")) normalized = normalized.slice(4);
  else if (normalized.startsWith("20") && normalized.length >= 12)
    normalized = normalized.slice(2);
  if (normalized.startsWith("0")) normalized = normalized.slice(1);
  if (normalized.length === 10) return `20${normalized}`;
  if (normalized.length >= 10) return normalized;
  return null;
}

export function buildCallCenterWhatsAppMessage(student: CallCenterStudent, opts: {
  lectureTitle?: string;
  courseTitle?: string;
  locale?: "ar" | "en";
}) {
  const ar = (opts.locale ?? "ar") === "ar";
  const attended = student.attended
    ? ar
      ? "حاضر"
      : "Present"
    : ar
      ? "غائب"
      : "Absent";

  const quiz =
    student.quizScore != null
      ? student.quizFullMark != null
        ? `${student.quizScore}/${student.quizFullMark}`
        : `${student.quizScore}`
      : ar
        ? "—"
        : "—";

  const choose =
    student.chooseTotal != null
      ? `${student.chooseCorrect ?? 0}/${student.chooseTotal}`
      : "—";

  const essay =
    student.essayTotal != null
      ? `${student.essayCorrect ?? 0}/${student.essayTotal}${
          student.essayPending
            ? ar
              ? ` (قيد التصحيح: ${student.essayPending})`
              : ` (pending: ${student.essayPending})`
            : ""
        }`
      : "—";

  const homework =
    student.homeworkScore != null
      ? student.homeworkFullMark != null
        ? `${student.homeworkScore}/${student.homeworkFullMark}`
        : `${student.homeworkScore}`
      : "—";

  if (ar) {
    return [
      "السلام عليكم ورحمة الله،",
      `تقرير الطالب: ${student.fullName}`,
      `كود الطالب: ${student.studentCode}`,
      opts.courseTitle ? `الكورس: ${opts.courseTitle}` : null,
      opts.lectureTitle ? `المحاضرة: ${opts.lectureTitle}` : null,
      `الحضور: ${attended}`,
      `درجة الكويز: ${quiz}`,
      `الواجب (اختيار): ${choose}`,
      `الواجب (مقالي): ${essay}`,
      `درجة الواجب الورقي: ${homework}`,
      student.comment ? `ملاحظة: ${student.comment}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "Hello,",
    `Student report: ${student.fullName}`,
    `Student code: ${student.studentCode}`,
    opts.courseTitle ? `Course: ${opts.courseTitle}` : null,
    opts.lectureTitle ? `Lecture: ${opts.lectureTitle}` : null,
    `Attendance: ${attended}`,
    `Quiz score: ${quiz}`,
    `Homework (choose): ${choose}`,
    `Homework (essay): ${essay}`,
    `Offline homework: ${homework}`,
    student.comment ? `Note: ${student.comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function openCallCenterWhatsApp(
  student: CallCenterStudent,
  opts: {
    lectureTitle?: string;
    courseTitle?: string;
    locale?: "ar" | "en";
  }
) {
  const phone = toWhatsAppPhone(student.parentPhoneNumber);
  if (!phone) return false;

  const text = encodeURIComponent(
    buildCallCenterWhatsAppMessage(student, opts)
  );
  window.open(
    `https://api.whatsapp.com/send/?phone=${phone}&text=${text}&type=phone_number&app_absent=0`,
    "_blank",
    "noopener,noreferrer"
  );
  return true;
}
