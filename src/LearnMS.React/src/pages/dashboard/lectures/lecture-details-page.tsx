import { useUpdateLectureAssetsMutation } from "@/api/lectures-api";
import {
  getLectureStatisticsParams,
  readSelectedCenterId,
  useAttendLectureAtCenter,
} from "@/api/centers-api";
import { CenterSelector } from "@/components/dashboard/center-selector";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/image-upload-field";
import { toast } from "@/components/ui/use-toast";
import { Lesson } from "@/types/lessons";
import { Quiz } from "@/types/quiz";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  Delete,
  Edit2,
  ListCollapse,
  Loader2,
  Menu,
  Settings2,
  Trash,
} from "lucide-react";
import Papa from "papaparse";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useDeleteLessonMutation } from "@/api/lessons-api";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getGetCourseQueryKey,
  getGetLectureQueryKey,
  getGetLectureStudentsQueryKey,
  getGetLectureStatisticsQueryKey,
  useCreateLesson,
  useDeleteLecture,
  useGetCourse,
  useGetLecture,
  useGetLectureStatistics,
  useGetLectureStudents,
  useGetProfile,
  usePublishLecture,
  useUnPublishLecture,
  useUpdateLecture,
  useUpdateLectureGrades,
} from "@/generated/api";
import { GetLectureDashboardResult, StudentGradeItem } from "@/generated/model";
import useDownloadFile from "@/hooks/useDownloadFile";
import { createLectureStudentsColumns } from "@/pages/dashboard/lectures/lecture-students-columns";
import { LectureStudentStats } from "@/pages/dashboard/lectures/lecture-student-stats";
import { useAssetsStore } from "@/store/use-assets-store";
import { useModalStore } from "@/store/use-modal-store";
import { useQueryClient } from "@tanstack/react-query";
import { PaginationState } from "@tanstack/react-table";
import _ from "lodash";
import {
  FaBarcode,
  FaCheck,
  FaFile,
  FaFileExport,
  FaFileImport,
  FaFilePdf,
  FaImage,
} from "react-icons/fa";
import { z } from "zod";

const LectureDetailsPage = () => {
  const { courseId, lectureId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, isLoading, isError } = useGetLecture(courseId!, lectureId!);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return;
  }

  const lecture = data?.data!;

  if (lecture?.$type !== "GetLectureDashboardResult") return;

  return (
    <DashboardPageShell
      title={lecture.title}
      description="Manage lecture details, content, PDFs, and students."
      icon={BookOpen}
      fullWidth
    >
      <Tabs
        className="w-full min-w-0"
        defaultValue="details"
        onValueChange={(value) => {
          setSearchParams({ view: value });
        }}
        value={searchParams.get("view") ?? "details"}
      >
        <TabsList className="mb-2 h-auto w-full justify-start overflow-x-auto bg-color2/5">
          <TabsTrigger value="details" className="shrink-0">
            Details
          </TabsTrigger>
          <TabsTrigger value="students" className="shrink-0">
            Students
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-0 min-w-0">
          <LectureDetailsTab lecture={lecture} courseId={courseId!} />
        </TabsContent>
        <TabsContent value="students" className="mt-0 min-w-0">
          <LectureStudentTab lecture={lecture} courseId={courseId!} />
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
};

export default LectureDetailsPage;

type TabProps = {
  lecture: GetLectureDashboardResult;
  courseId: string;
};

const LectureStudentTab: React.FC<TabProps> = ({ lecture, courseId }) => {
  const { download, isDownloading } = useDownloadFile();
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(
    () => readSelectedCenterId()
  );
  const [selectedCenterName, setSelectedCenterName] = useState<string>();

  const handleCenterChange = useCallback(
    (centerId: string | null, center?: { name: string }) => {
      setSelectedCenterId(centerId);
      setSelectedCenterName(center?.name);
    },
    []
  );

  const qc = useQueryClient();
  const updateLecture = useUpdateLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId, lecture.id),
        });
        toast({
          title: "Full marks saved",
          description: "You can now enter student scores.",
        });
      },
      onError(error: Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  const updateLectureGrades = useUpdateLectureGrades({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureStudentsQueryKey(courseId, lecture.id),
        });
        qc.invalidateQueries({
          queryKey: getGetLectureStatisticsQueryKey({ lectureId: lecture.id }),
        });
      },
      onError(error: Error) {
        toast({
          title: "Error",
          description: error.message,
        });
      },
    },
  });

  const { data: lectureStatistics, isLoading: lectureStatisticsLoading } =
    useGetLectureStatistics(
      getLectureStatisticsParams(lecture.id, selectedCenterId) as any
    );

  const studentColumns = useMemo(
    () =>
      createLectureStudentsColumns(selectedCenterId, {
        homeworkFullMark: lecture.homeworkFullMark,
        quizFullMark: lecture.quizFullMark,
      }),
    [selectedCenterId, lecture.homeworkFullMark, lecture.quizFullMark]
  );

  const { data: gradeTotalData } = useGetLectureStudents(
    lecture.courseId,
    lecture.id,
    { page: 1, pageSize: 1 }
  );

  const { data: courseData } = useGetCourse(courseId);
  const gradeLevel =
    courseData?.data?.$type === "GetDashboardCourseResult"
      ? courseData.data.level
      : undefined;

  const totalInGrade = gradeTotalData?.data?.totalCount ?? 0;

  const [searchParams, setSearchParams] = useSearchParams();
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(searchParams.get("page") ?? 1) - 1,
    pageSize: Number(searchParams.get("pageSize") ?? 10),
  });
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      view: "students",
      ...(search ? { search } : {}),
    });
  }, [pageIndex, search, pageSize]);
  const { data, isLoading } = useGetLectureStudents(
    lecture.courseId,
    lecture.id,
    {
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 10,
      search,
    }
  );

  const onExport = async () => {
    await download(
      `/api/courses/${lecture.courseId}/lectures/${lecture.id}/students/export`,
      "students.csv"
    );
  };

  const onImport = async () => {
    try {
      const [file] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "CSV",
            accept: {
              "text/csv": [".csv"],
            },
          },
        ],
      });

      const f = await file.getFile();
      Papa.parse(f, {
        complete(results: any) {
          const codes = results.data
            .filter((x: any) => x[0]) // Ensure the code column exists and is not empty
            .map(([code]: any) => ({ code })); // Create StudentGradeItem objects

          if (codes.length === 0) {
            toast({
              title: "Import Error",
              description: "No valid student codes found in the CSV file.",
            });
            return;
          }

          updateLectureGrades.mutate({
            courseId,
            lectureId: lecture.id,
            data: {
              grades: codes as StudentGradeItem[], // Ensure correct type
            },
          });
        },
        error(err: any) {
          toast({
            title: "Import Error",
            description: `Failed to parse CSV file: ${err.message}`,
          });
        },
      });
    } catch (error: any) {
      toast({
        title: "File Error",
        description: `Failed to open file: ${error.message}`,
      });
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <LectureStudentStats
        stats={lectureStatistics?.data}
        isLoading={lectureStatisticsLoading}
        totalInGrade={totalInGrade}
        gradeLevel={gradeLevel}
        filteredCount={data?.data?.totalCount}
        isSearching={!!search.trim()}
        selectedCenterName={selectedCenterName}
      />

      <CenterSelector
        value={selectedCenterId}
        onChange={handleCenterChange}
        className="rounded-xl border border-color2/15 bg-muted/20 p-3"
      />

      <LectureFullMarksForm
        lecture={lecture}
        isSaving={updateLecture.isPending}
        onSave={(data) =>
          updateLecture.mutate({
            courseId,
            lectureId: lecture.id,
            data,
          })
        }
      />

      {!selectedCenterId && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Select an attendance center before scanning barcodes or marking students
          as attended.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Input
          className="w-full"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <AttendInput
            lectureId={lecture.id}
            courseId={lecture.courseId}
            centerId={selectedCenterId}
          />
          <Button
            disabled={updateLectureGrades.isPending}
            variant="outline"
            className="w-full border-red-200 text-red-500 sm:w-auto"
            onClick={onImport}
          >
            {updateLectureGrades.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FaFileImport className="h-4 w-4" />
            )}
            <span className="ml-2">Import CSV</span>
          </Button>
          <Button
            disabled={isDownloading}
            variant="outline"
            className="w-full text-primary sm:w-auto"
            onClick={onExport}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FaFileExport className="h-4 w-4" />
            )}
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loading />
        </div>
      ) : (
        <DataTable
          data={data?.data!.items!}
          pagination={{
            hasNextPage: data!.data!.hasNextPage,
            hasPreviousPage: data!.data!.hasPreviousPage,
            pageIndex,
            pageSize,
            pageCount: data!.data!.totalCount,
          }}
          rowCount={data?.data!.totalCount!}
          columns={studentColumns}
          setPagination={setPagination}
        />
      )}
    </div>
  );
};

function LectureFullMarksForm({
  lecture,
  isSaving,
  onSave,
}: {
  lecture: GetLectureDashboardResult;
  isSaving: boolean;
  onSave: (data: {
    homeworkFullMark?: number;
    quizFullMark?: number;
  }) => void;
}) {
  const [homeworkFullMark, setHomeworkFullMark] = useState(
    lecture.homeworkFullMark?.toString() ?? ""
  );
  const [quizFullMark, setQuizFullMark] = useState(
    lecture.quizFullMark?.toString() ?? ""
  );

  useEffect(() => {
    setHomeworkFullMark(lecture.homeworkFullMark?.toString() ?? "");
    setQuizFullMark(lecture.quizFullMark?.toString() ?? "");
  }, [lecture.homeworkFullMark, lecture.quizFullMark]);

  const hw = Number(homeworkFullMark);
  const qz = Number(quizFullMark);
  const hwValid = Number.isFinite(hw) && hw > 0;
  const qzValid = Number.isFinite(qz) && qz > 0;
  const canSave = hwValid || qzValid;

  return (
    <div className="rounded-xl border border-color2/20 bg-color2/5 p-3 sm:p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          Offline score full marks
        </h3>
        <p className="text-xs text-muted-foreground">
          Set full marks first, then enter each student score (out of these
          totals).
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Homework full mark
          </label>
          <Input
            type="number"
            min={0.01}
            step="any"
            placeholder="e.g. 20"
            value={homeworkFullMark}
            onChange={(e) => setHomeworkFullMark(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Quiz full mark
          </label>
          <Input
            type="number"
            min={0.01}
            step="any"
            placeholder="e.g. 10"
            value={quizFullMark}
            onChange={(e) => setQuizFullMark(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <Button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => {
            const data: {
              homeworkFullMark?: number;
              quizFullMark?: number;
            } = {};
            if (hwValid) data.homeworkFullMark = hw;
            if (qzValid) data.quizFullMark = qz;
            onSave(data);
          }}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save full marks"
          )}
        </Button>
      </div>
      {(!lecture.homeworkFullMark || !lecture.quizFullMark) && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Score fields unlock after their full mark is saved.
        </p>
      )}
    </div>
  );
}

const LectureDetailsTab: React.FC<TabProps> = ({ lecture }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { mutate: publish, isPending: isPublishing } = usePublishLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(lecture.courseId!, lecture.id),
        });
        toast({
          title: "Publishing",
          description: lecture.isPublished
            ? "Successfully unpublished the course"
            : "Successfully published the course",
        });
      },
    },
  });
  const { mutate: unPublish, isPending: isUnPublishing } = useUnPublishLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(lecture.courseId!, lecture.id),
        });
        toast({
          title: "UnPublishing",
          description: lecture.isPublished
            ? "Successfully unpublished the course"
            : "Successfully published the course",
        });
      },
    },
  });
  const { mutate: deleteLecture, isPending: isDeleting } = useDeleteLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetCourseQueryKey(lecture.courseId!),
        });
        navigate(`/dashboard/courses/${lecture.courseId}`, {
          replace: true,
        });
        toast({
          title: "Deleting",
          description: "Successfully deleted the lecture",
        });
      },
    },
  });

  const { data: profile } = useGetProfile();

  const isLoading = isPublishing || isDeleting || isUnPublishing;

  if (
    profile?.data?.$type === "GetAssistantProfileResult" &&
    !profile.data.permissions.includes("ManageLecture")
  ) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <p>You do not have permission to view this page</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  const onPublish = () => {
    if (lecture.isPublished) {
      unPublish({ courseId: lecture.courseId!, lectureId: lecture.id });
    } else {
      publish({ courseId: lecture.courseId!, lectureId: lecture.id });
    }
  };

  return (
    <div className="w-full min-w-0">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
        <Confirmation
          button={
            <Button variant="destructive" className="w-full sm:w-auto">
              Delete
            </Button>
          }
          title="Are you sure you want to delete this lecture?"
          description="This action cannot be undone."
          onConfirm={() => {
            deleteLecture({
              courseId: lecture.courseId!,
              lectureId: lecture.id,
            });
          }}
        />

        <Button
          disabled={isLoading}
          onClick={onPublish}
          className="w-full border border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto"
        >
          {lecture.isPublished ? "UnPublish" : "Publish"}
        </Button>
      </div>

      <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <DashboardCard padding="sm" className="min-w-0">
          <LectureDetailsForm {...lecture} />
        </DashboardCard>
        <DashboardCard padding="sm" className="min-w-0">
          <LectureContentForm {...lecture} />
        </DashboardCard>
        <DashboardCard padding="sm" className="min-w-0 lg:col-span-2">
          <LectureAssetsFrom {...lecture} />
        </DashboardCard>
      </div>
    </div>
  );
};

const UpdateLectureRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string(),
  price: z.coerce.number().min(0, { message: "Price must be greater than 0" }),
  renewalPrice: z.coerce
    .number()
    .min(0, { message: "Renewal Price is greater than 0" }),
  expirationDays: z.coerce
    .number()
    .min(0, { message: "Expiration days must be greater than 0" }),
  imageUrl: z.string(),
  homeworkVideoUrl: z
    .string()
    .trim()
    .refine(
      (v) =>
        !v ||
        /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(v),
      { message: "Enter a valid YouTube link" }
    )
    .optional()
    .or(z.literal("")),
});

type UpdateLectureRequest = z.infer<typeof UpdateLectureRequest>;

function LectureDetailsForm({
  id,
  description,
  title,
  expirationDays,
  imageUrl,
  homeworkVideoUrl,
  renewalPrice,
  courseId,
  price,
}: GetLectureDashboardResult) {
  const qc = useQueryClient();
  const { mutate: updateLecture, isPending } = useUpdateLecture({
    mutation: {
      onSuccess: (data) => {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId!, id),
        });
        toast({
          title: "Lecture updated",
          description: data.message,
        });
      },
    },
  });

  const form = useForm<UpdateLectureRequest>({
    resolver: zodResolver(UpdateLectureRequest),
    defaultValues: {
      description,
      expirationDays,
      renewalPrice,
      price,
      imageUrl,
      homeworkVideoUrl: homeworkVideoUrl ?? "",
    },
    values: {
      description,
      title,
      expirationDays,
      renewalPrice,
      price,
      imageUrl,
      homeworkVideoUrl: homeworkVideoUrl ?? "",
    },
  });

  const onSubmit = (data: UpdateLectureRequest) => {
    updateLecture({
      lectureId: id,
      courseId,
      data,
    });
  };

  return (
    <div className="w-full min-w-0">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2">
          <fieldset
            className="flex flex-col gap-3 p-1 sm:flex-row sm:items-center sm:gap-2"
            disabled={isPending}>
            <div className="flex min-w-0 items-center gap-2 text-lg sm:text-xl">
              <Settings2 className="h-9 w-9 shrink-0 rounded-full bg-color2/15 p-1 text-color2" />
              <span className="truncate">Session Details</span>
            </div>
            {form.formState.isDirty && (
              <div className="flex flex-wrap gap-2 sm:ms-auto">
                <Button className="flex-1 bg-primary sm:flex-none">Save</Button>
                <Button
                  variant="outline"
                  type="button"
                  className="flex-1 border-color2/20 sm:flex-none"
                  onClick={() => form.reset()}>
                  Reset
                </Button>
              </div>
            )}
          </fieldset>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>Title</FormLabel>
                <FormControl>
                  <Input className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded '>
                <FormLabel className='text-primary'>Description</FormLabel>
                <FormControl>
                  <div style={{ height: "200px", width: "100%" }}>
                    <textarea
                      className='text-color2'
                      style={{
                        height: "100%",
                        width: "100%",
                        resize: "none",
                        fontSize: "14px",
                      }} // Fill the container
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='homeworkVideoUrl'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>
                  Lecture Video Homework (YouTube)
                </FormLabel>
                <FormControl>
                  <Input
                    className='text-primary'
                    placeholder='https://www.youtube.com/watch?v=...'
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='renewalPrice'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>RenewalPrice</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='expirationDays'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>Expiration Days</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='imageUrl'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>Image</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

function LectureContentForm({
  items,
  id: lectureId,
  courseId,
}: GetLectureDashboardResult) {
  const [isAddingLesson, setIsAddingLecture] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-lg sm:text-xl">
          <ListCollapse className="h-9 w-9 shrink-0 rounded-full bg-color2/15 p-1 text-color2" />
          <span className="truncate">Session Content</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isAddingLesson ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-md p-1.5 hover:bg-muted">
                  <Menu className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="hover:cursor-pointer hover:bg-color2 hover:text-primary-foreground"
                    onClick={() => setIsAddingLecture(true)}>
                    Add Lesson
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link
                    to={`/dashboard/courses/${courseId}/lectures/${lectureId}/quizzes/add`}>
                    <DropdownMenuItem>Add Quiz</DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsAddingLecture(false);
              }}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      {isAddingLesson && (
        <AddLessonForm
          courseId={courseId}
          lectureId={lectureId}
          onClose={() => setIsAddingLecture(false)}
        />
      )}

      {!isAddingLesson && (
        <div className='flex flex-col gap-2'>
          {items.map((item) => (
            <LectureItem
              key={item.id}
              item={item}
              courseId={courseId}
              lectureId={lectureId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LectureItem({
  item,
  courseId,
  lectureId,
}: {
  item: Quiz | Lesson;
  courseId: string;
  lectureId: string;
}) {
  const { mutate } = useDeleteLessonMutation();

  const qc = useQueryClient();

  const onDelete = () => {
    mutate(
      { courseId, lessonId: item.id, lectureId },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Lesson deleted successfully",
          });
          qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
          qc.invalidateQueries({
            queryKey: ["lecture", { id: lectureId, courseId }],
          });
        },
      }
    );
  };

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2 rounded border border-color2/25 bg-color2/10 text-primary">
      <div className="min-w-0 flex-1 p-2">
        <p className="truncate">{item.title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pe-2">
        {item.type === "Lesson" && (
          <Confirmation
            title="Delete Lesson"
            description="Are you sure you want to delete this lesson?"
            onConfirm={onDelete}
            button={
              <Trash
                className="h-4 w-4 hover:scale-105 hover:cursor-pointer"
                color="red"
              />
            }
          />
        )}
        <Badge className="h-5">{item.type}</Badge>
        <Link
          to={`/dashboard/courses/${courseId}/lectures/${lectureId}/${
            item.type === "Lesson" ? "lessons" : "quizzes"
          }/${item.id}`}
        >
          <Edit2 className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

const AddLessonRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  expirationHours: z.coerce
    .number()
    .min(0)
    .max(24, { message: "Expiration hours must be less than 24" }),
  renewalPrice: z.coerce
    .number()
    .min(0, { message: "Renewal Price is greater than 0" }),
  description: z.string().min(1, { message: "Description is required" }),
});

type AddLessonRequest = z.infer<typeof AddLessonRequest>;

function AddLessonForm({
  courseId,
  lectureId,
  onClose,
}: {
  courseId: string;
  lectureId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const createLessonMutation = useCreateLesson({
    mutation: {
      onSuccess: (data) => {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId, lectureId),
        });
        toast({
          title: "Lesson added",
          description: data.message,
        });
        onClose();
      },
    },
  });

  const form = useForm<AddLessonRequest>({
    resolver: zodResolver(AddLessonRequest),
    defaultValues: {
      title: "",
      description: "",
      expirationHours: 0,
      renewalPrice: 0,
    },
  });

  const onSubmit = (data: AddLessonRequest) => {
    createLessonMutation.mutate({ courseId, lectureId, data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          className='p-2 space-y-2 border-2 border-color2/30 rounded'
          disabled={createLessonMutation.isPending}>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Title</FormLabel>
                <FormControl>
                  <Input type='text' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Description</FormLabel>
                <FormControl>
                  <Input type='text' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='renewalPrice'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Renewal Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='expirationHours'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Expiration Hours</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Add</Button>
        </fieldset>
      </form>
    </Form>
  );
}

function LectureAssetsFrom({
  assets: oldAssets,
  id,
  courseId,
}: GetLectureDashboardResult) {
  const { openModal } = useModalStore();
  const { clearAssets, addAssets, assets, removeAsset } = useAssetsStore();

  const updateLectureAssetsMutation = useUpdateLectureAssetsMutation();

  const onUpdate = () => {
    updateLectureAssetsMutation.mutate(
      { lectureId: id, courseId, data: assets.map((asset) => asset.id) },
      {
        onSuccess: (data) => {
          toast({
            title: "PDF updated",
            description: data.message,
          });
        },
      }
    );
  };

  const isDirty = useMemo(
    () => !_.isEqual(_.sortBy(oldAssets, "id"), _.sortBy(assets, "id")),
    [oldAssets, assets]
  );

  const oldAssetIds = (oldAssets ?? []).map((a) => a.id).sort().join(",");

  useEffect(() => {
    clearAssets();
    addAssets(oldAssets ?? []);
  }, [oldAssetIds]);

  const assetHref = (asset: (typeof assets)[number]) =>
    asset.url || `/api/assets/${asset.id}`;

  return (
    <div className="h-full w-full min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xl sm:text-2xl">
          <div className="rounded-full border-primary/40 bg-primary/30 p-2.5 sm:p-3">
            <FaFile className="text-primary" />
          </div>
          PDF
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isDirty && (
            <Button className="w-full sm:w-auto" onClick={onUpdate}>
              Update
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => openModal("select-assets-modal")}
          >
            From Files
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() =>
              openModal("add-pdf-links-modal", {
                courseId,
                lectureId: id,
              })
            }
          >
            Add PDF
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded border-[3px] border-primary/50 bg-primary/30 p-4 sm:gap-4 sm:p-6 md:p-10">
        {assets.length === 0 && (
          <p className="self-center text-2xl text-primary/40 sm:text-4xl md:text-5xl">
            NO PDFs
          </p>
        )}
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="relative h-fit w-full rounded-xl bg-card/85 p-4 sm:w-52 sm:p-5"
          >
            <Button
              className="absolute right-0 top-0"
              size="icon"
              onClick={() => removeAsset(asset.id)}
              variant="destructive"
            >
              <Delete />
            </Button>
            {asset.type === "Image" && (
              <a href={assetHref(asset)} target="_blank" rel="noreferrer">
                <FaImage className="h-16 w-full text-primary/40 sm:h-full" />
              </a>
            )}
            {asset.type === "Pdf" && (
              <a href={assetHref(asset)} target="_blank" rel="noreferrer">
                <FaFilePdf className="h-16 w-full text-primary/40 sm:h-full" />
              </a>
            )}
            {asset.type === "Unknown" && (
              <a href={assetHref(asset)} target="_blank" rel="noreferrer">
                <FaFile className="h-16 w-full text-primary/40 sm:h-full" />
              </a>
            )}
            <p className="mt-2 break-words font-medium">{asset.name}</p>
            {asset.lectureName && (
              <p className="break-words text-xs text-muted-foreground">
                {asset.lectureName}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendInput({
  lectureId,
  courseId,
  centerId,
}: {
  lectureId: string;
  courseId: string;
  centerId: string | null;
}) {
  const navigate = useNavigate();
  const [showManual, setShowManual] = useState(false);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { mutate: attendLecture, isPending } = useAttendLectureAtCenter({
    mutation: {
      throwOnError: false,
    },
  });

  useEffect(() => {
    if (!showManual) return;
    const timer = setTimeout(() => {
      if (code.length > 0) handleSubmit();
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, showManual]);

  const handleSubmit = async () => {
    if (!code || !centerId) {
      if (!centerId) {
        toast({
          title: "Select a center",
          description: "Choose an attendance center before marking attendance.",
          variant: "destructive",
        });
      }
      return;
    }

    attendLecture(
      {
        courseId,
        lectureId,
        code,
        centerId,
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Success",
            description: data.message,
          });
          qc.invalidateQueries({
            queryKey: getGetLectureStudentsQueryKey(courseId, lectureId),
          });
          qc.invalidateQueries({
            queryKey: getGetLectureStatisticsQueryKey(
              getLectureStatisticsParams(lectureId, centerId) as any
            ),
          });
          setCode("");
          inputRef.current?.focus();
        },
        onError: (_) => {
          setCode("");
          inputRef.current?.focus();
        },
      }
    );
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Button
        className="w-full gap-2 bg-gradient-to-r from-color1 to-color2 sm:w-auto"
        disabled={!centerId}
        onClick={() =>
          navigate(
            `/dashboard/courses/${courseId}/lectures/${lectureId}/scan`
          )
        }
      >
        <FaBarcode className="h-4 w-4" />
        Scan Barcode
      </Button>
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => setShowManual((state) => !state)}
      >
        {showManual ? "Hide Manual" : "Manual Entry"}
      </Button>
      {showManual && (
        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            ref={inputRef}
            type="text"
            className="w-full text-primary sm:w-[200px]"
            placeholder="Student code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={isPending}
            className="shrink-0"
          >
            <FaCheck className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
