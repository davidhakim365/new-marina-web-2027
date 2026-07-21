import { useDeleteStudentMutation } from "@/api/students-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getGetAllStudentsQueryKey,
  useAddStudentCredit,
  useUnlinkStudentDevice,
} from "@/generated/api";
import {
  SingleStudent,
  SingleStudentEvent,
  SingleStudentExam,
  SingleStudentLecture,
} from "@/generated/model";
import { useModalStore } from "@/store/use-modal-store";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Circle,
  CreditCard,
  MoreHorizontal,
  MoreVertical,
  Network,
  Trash,
} from "lucide-react";
import { FaChrome } from "react-icons/fa";
import { Link } from "react-router-dom";
import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

const levelKeys = {
  Level0: "admin.levels.level0",
  Level1: "admin.levels.level1",
  Level2: "admin.levels.level2",
  Level3: "admin.levels.level3",
} as const;

export const useStudentsColumns = (): ColumnDef<SingleStudent>[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        id: "actions",
        header: t("admin.students.columns.actions"),
        enableHiding: false,
        size: 120,
        cell: ({ row }) => {
          const student = row.original;
          const { openModal } = useModalStore();
          const qc = useQueryClient();
          const deleteStudentMutation = useDeleteStudentMutation();

          const unlinkDeviceMutation = useUnlinkStudentDevice({
            mutation: {
              onSuccess: () => {
                qc.invalidateQueries({ queryKey: getGetAllStudentsQueryKey() });
              },
            },
          });

          const onUnlink = () => {
            unlinkDeviceMutation.mutate({ studentId: student.id });
          };

          const onDeleting = () => {
            deleteStudentMutation.mutate({ id: student.id });
          };

          const addStudentCredit = useAddStudentCredit({
            mutation: {
              onSuccess: () => {
                qc.invalidateQueries({ queryKey: getGetAllStudentsQueryKey() });
                toast({
                  title: t("admin.students.toasts.creditAdded"),
                  description: t("admin.students.toasts.creditAddedDesc", {
                    name: student.fullName,
                  }),
                });
              },
              onError: () => {
                toast({
                  title: t("admin.common.error"),
                  description: t("admin.students.toasts.creditFailed"),
                  variant: "destructive",
                });
              },
            },
          });

          const onQuickAddCredit = () => {
            addStudentCredit.mutate({
              studentId: student.id,
              data: { amount: 65 },
            });
          };

          return (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-center">
              <div className="flex flex-col gap-1 w-full sm:hidden">
                <Button
                  onClick={onUnlink}
                  className="w-full gap-1 text-red-500 border-none hover:bg-red-500 hover:text-white text-xs"
                  variant="outline"
                  size="sm"
                >
                  <Network className="w-3 h-3" />
                  {t("admin.students.actions.unlink")}
                </Button>
                <Button
                  onClick={onQuickAddCredit}
                  className="w-full gap-1 text-green-600 hover:bg-green-100 hover:text-green-800 text-xs"
                  size="sm"
                >
                  <CreditCard className="w-3 h-3" />
                  +65
                </Button>
              </div>

              <div className="hidden sm:flex gap-2 items-center">
                <Button
                  onClick={onUnlink}
                  className="gap-2 text-red-500 border-none hover:bg-red-500 hover:text-white"
                  variant="outline"
                  size="sm"
                >
                  <Network className="w-4 h-4" />
                  <span className="hidden lg:inline">
                    {t("admin.students.actions.unlink")}
                  </span>
                </Button>
                <Button
                  onClick={onQuickAddCredit}
                  className="gap-2 text-green-600 hover:bg-green-100 hover:text-green-800"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4" />
                  +65
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-8 h-8 p-0">
                    <span className="sr-only">
                      {t("admin.students.actions.openMenu")}
                    </span>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="text-center shadow-md shadow-primary min-w-[200px]"
                >
                  <DropdownMenuLabel>
                    {t("admin.students.columns.actions")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openModal("add-credit-modal", { student })}
                    className="flex items-center gap-2 hover:cursor-pointer hover:bg-primary hover:text-white"
                  >
                    <CreditCard />
                    {t("admin.students.actions.addCredit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link to={`/dashboard/students/${student.id}`}>
                    <DropdownMenuItem className="flex items-center gap-2 hover:cursor-pointer hover:bg-primary hover:text-white">
                      <MoreVertical /> {t("admin.students.actions.view")}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <div className="grid items-center w-full grid-cols-1 gap-2 hover:cursor-pointer hover:text-red-500">
                    <Confirmation
                      button={
                        <Button
                          className="items-center flex w-full gap-2 text-red-500 border-none hover:bg-red-500 hover:text-white"
                          variant="outline"
                          size="sm"
                        >
                          <Trash className="w-4 h-4" />
                          {t("admin.students.actions.delete")}
                        </Button>
                      }
                      title={t("admin.students.actions.deleteConfirmTitle")}
                      description={t(
                        "admin.students.actions.deleteConfirmDesc"
                      )}
                      onConfirm={onDeleting}
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
      {
        accessorKey: "studentCode",
        header: t("admin.students.columns.id"),
        size: 80,
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm font-mono">
            {row.getValue("studentCode")}
          </div>
        ),
      },
      {
        accessorKey: "credit",
        header: t("admin.students.columns.credit"),
        size: 80,
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm font-medium">
            {row.getValue("credit")}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: t("admin.students.columns.email"),
        size: 200,
        cell: ({ row }) => (
          <div
            className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]"
            title={row.getValue("email")}
          >
            {row.getValue("email")}
          </div>
        ),
      },
      {
        accessorKey: "fullName",
        header: t("admin.students.columns.fullName"),
        size: 150,
        cell: ({ row }) => (
          <div
            className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]"
            title={row.getValue("fullName")}
          >
            {row.getValue("fullName")}
          </div>
        ),
      },
      {
        accessorKey: "governorate",
        header: t("admin.students.columns.governorate"),
        size: 140,
        cell: ({ row }) => {
          const value = (row.original.governorate || "").trim();
          return (
            <div
              className="text-xs sm:text-sm truncate max-w-[140px]"
              title={value}
            >
              {value || t("admin.students.unspecified")}
            </div>
          );
        },
      },
      {
        accessorKey: "level",
        header: t("admin.students.columns.level"),
        size: 120,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div className="text-xs sm:text-sm">
              {t(levelKeys[student.level])}
            </div>
          );
        },
      },
      {
        accessorKey: "deviceLinked",
        header: t("admin.students.columns.device"),
        size: 80,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div className="flex items-center justify-center">
              {student.deviceLinked ? (
                <FaChrome
                  className="w-4 h-4 sm:w-6 sm:h-6 text-primary"
                  title={t("admin.students.deviceLinked")}
                />
              ) : (
                <FaChrome
                  className="w-4 h-4 sm:w-6 sm:h-6 text-zinc-400"
                  title={t("admin.students.deviceNotLinked")}
                />
              )}
            </div>
          );
        },
      },
    ],
    [t]
  );
};

export const studentLecturesColumns: ColumnDef<SingleStudentLecture>[] = [
  {
    accessorKey: "title",
    header: "Lecture",
    cell({ row }) {
      const lecture = row.original;
      return (
        <div>
          <Link
            className="underline hover:cursor-pointer hover:text-color2"
            to={`/dashboard/courses/${lecture.courseId}/lectures/${lecture.id}`}
          >
            {lecture.title}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "courseTitle",
    header: "Course",
  },
  {
    header: "Center Attendance",
    cell: ({ row }) => {
      const attended = row.original.attended;
      return (
        <div className="flex items-center justify-center">
          {attended ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "enrollmentStatus",
    header: "Online Enrollment",
    cell({ row }) {
      const status = row.original.enrollmentStatus;
      return status ? status : "Not Enrolled";
    },
  },
  {
    accessorKey: "homeworkScore",
    header: "Homework",
    cell({ row }) {
      const score = row.original.homeworkScore;
      return score === 1 || score == null ? "-" : score;
    },
  },
  {
    accessorKey: "quizScore",
    header: "Quiz Score",
    cell({ row }) {
      const score = row.original.quizScore;
      return score != null ? score : "-";
    },
  },
  {
    accessorKey: "studentQuizzesScore",
    header: "Online Quizzes Score",
    cell({ row }) {
      const studentScore = row.original.studentQuizzesScore;
      const totalScore = row.original.totalQuizzesScore;
      return studentScore != null && totalScore != null
        ? `${studentScore} / ${totalScore}`
        : "-";
    },
  },
];

export const studentEventsColumns: ColumnDef<SingleStudentEvent>[] = [
  {
    accessorKey: "message",
    header: "Message",
    size: 300,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    size: 10,
    cell({ row }) {
      const event = row.original;
      return <div>{new Date(event.createdAt).toLocaleString()}</div>;
    },
  },
];

export const studentExamsColumns: ColumnDef<SingleStudentExam>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell({ row }) {
      const exam = row.original;
      return (
        <div>
          <Link
            className="underline hover:cursor-pointer hover:text-color2"
            to={`/dashboard/courses/${exam.courseId}/exams/${exam.id}`}
          >
            {exam.title}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "studentScore",
    header: "Score",
    cell({ row }) {
      const exam = row.original;
      if (!exam.studentScore || !exam.totalScore) return;
      return (
        <div>
          {exam.studentScore} / {exam.totalScore}
        </div>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted At",
    cell({ row }) {
      const exam = row.original;
      if (!exam.submittedAt) return;
      return <div>{new Date(exam.submittedAt).toLocaleDateString()}</div>;
    },
  },
];
