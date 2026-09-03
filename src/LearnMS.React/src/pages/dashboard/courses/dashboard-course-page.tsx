import { AddLectureRequest } from "@/api/lectures-api";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  getGetCourseQueryKey,
  useCreateLecture,
  useDeleteCourse,
  useGetCourse,
  usePublishCourse,
  useUnpublishCourse,
  useUpdateCourse,
} from "@/generated/api";
import { GetDashboardCourseResult, Permission, SingleCourseItem } from "@/generated/model";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, ListCollapse, Menu, Settings2, BookOpen } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const DashboardCoursePage = () => {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useDashboardPermissions();
  const canManageCourses = hasPermission(Permission.ManageCourses);
  const canManageLectures = hasPermission(Permission.ManageLecture);

  const { data, isLoading, isError, refetch } = useGetCourse(courseId!);

  const publishCourseMutation = usePublishCourse({
    mutation: {
      onSuccess(data) {
        toast({
          title: "Publishing",
          description: data.message,
        });
        refetch();
      },
    },
  });
  const unPublishCourseMutation = useUnpublishCourse({
    mutation: {
      onSuccess(data) {
        toast({
          title: "UnPublishing",
          description: data.message,
        });
        refetch();
      },
    },
  });
  const deleteCourseMutation = useDeleteCourse({
    mutation: {
      onSuccess(data) {
        toast({
          title: "Deleting",
          description: data.message,
        });
        navigate("/dashboard/courses", { replace: true });
      },
    },
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  if (isError) {
    return;
  }
  const course = data!.data!;

  if (course.$type !== "GetDashboardCourseResult") return;

  const onPublishing = () => {
    if (course.isPublished) {
      unPublishCourseMutation.mutate({ courseId: course.id });
    } else {
      publishCourseMutation.mutate({ courseId: course.id });
    }
  };

  const onDeleting = () => {
    deleteCourseMutation.mutate({ courseId: course.id });
  };

  return (
    <DashboardPageShell
      title={t("admin.courses.setupTitle")}
      description={course.title}
      icon={BookOpen}
      fullWidth
      actions={
        canManageCourses ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Confirmation
              disabled={deleteCourseMutation.isPending}
              description={t("admin.courses.deleteConfirm")}
              title={t("admin.courses.deleteTitle")}
              onConfirm={onDeleting}
              button={
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={deleteCourseMutation.isPending}
                >
                  {t("admin.common.delete")}
                </Button>
              }
            />
            <Button
              onClick={onPublishing}
              className="w-full border border-color2/40 bg-gradient-to-r from-color1 to-color2 text-white shadow-md shadow-color2/20 hover:opacity-90 sm:w-auto"
            >
              {course.isPublished
                ? t("admin.courses.unpublish")
                : t("admin.courses.publish")}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {canManageCourses && (
          <DashboardCard padding="sm" className="min-w-0">
            <CourseDetailsForm {...course} />
          </DashboardCard>
        )}
        <DashboardCard padding="sm" className="min-w-0">
          <CourseContentForm
            {...course}
            canManageCourses={canManageCourses}
            canManageLectures={canManageLectures}
          />
        </DashboardCard>
      </div>
    </DashboardPageShell>
  );
};

const UpdateCourseRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string(),
  expirationDays: z.coerce
    .number()
    .min(0, { message: "Expiration days must be greater than 0" }),
    imageUrl: z.string(),
  level: z.enum(["Level0", "Level1", "Level2", "Level3", "Level4", "Level5"]),
});

type UpdateCourseRequest = z.infer<typeof UpdateCourseRequest>;

function CourseDetailsForm({
  id,
  description,
  title,
  expirationDays,
  imageUrl,
  level,
  price,
  renewalPrice,
}: GetDashboardCourseResult) {
  const updateCourseMutation = useUpdateCourse();

  const form = useForm<UpdateCourseRequest>({
    resolver: zodResolver(UpdateCourseRequest),
    defaultValues: {
      description,
      title,
      expirationDays,
      level,
      imageUrl,
    },
    values: {
      level,
      description,
      title,
      expirationDays,
      imageUrl,
    },
  });

  const onSubmit = (data: UpdateCourseRequest) => {
    updateCourseMutation.mutate(
      {
        courseId: id,
        data: {
          ...data,
          price,
          renewalPrice,
        },
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Course updated",
            description: data.message,
          });
        },
      }
    );
  };

  return (
    <div className="w-full min-w-0">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2">
          <fieldset
            className="flex flex-col gap-3 p-1 sm:flex-row sm:items-center sm:gap-2"
            disabled={updateCourseMutation.isPending}>
            <div className="flex min-w-0 items-center gap-2 text-lg sm:text-xl">
              <Settings2 className="h-9 w-9 shrink-0 rounded-full bg-color2/15 p-1 text-color2" />
              <span className="truncate">Course Details</span>
            </div>
            {form.formState.isDirty && (
              <div className="flex flex-wrap gap-2 sm:ms-auto">
                <Button className="flex-1 bg-color2/50 sm:flex-none">Save</Button>
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
                <FormLabel className='text-color2'>Title</FormLabel>
                <FormControl>
                  <Input className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>Description</FormLabel>
                <FormControl>
                  <Input className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='level'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className='text-color2'>
                      <SelectValue placeholder='Select a level' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='Level0'>2nd Prep</SelectItem>
                    <SelectItem value='Level1'>3rd Prep</SelectItem>
                    <SelectItem value='Level2'>1st Secondary General</SelectItem>
                    <SelectItem value='Level4'>1st Secondary Baccalaureate</SelectItem>
                    <SelectItem value='Level3'>2nd Secondary General</SelectItem>
                    <SelectItem value='Level5'>2nd Secondary Baccalaureate</SelectItem>
                  </SelectContent>
                </Select>
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
                <FormLabel className='text-color2'>Image</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    disabled={updateCourseMutation.isPending}
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

function CourseContentForm({
  items,
  id,
  canManageCourses,
  canManageLectures,
}: GetDashboardCourseResult & {
  canManageCourses: boolean;
  canManageLectures: boolean;
}) {
  const { t } = useTranslation();
  const [isAddingLecture, setIsAddingLecture] = useState(false);
  const navigate = useNavigate();
  const canAddContent = canManageLectures || canManageCourses;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-lg sm:text-xl">
          <ListCollapse className="h-9 w-9 shrink-0 rounded-full bg-color2/15 p-1 text-color2" />
          <span className="truncate">{t("admin.courses.content")}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canAddContent && !isAddingLecture ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-md p-1.5 hover:bg-muted">
                  <Menu className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canManageLectures && (
                    <DropdownMenuItem
                      className="hover:cursor-pointer hover:bg-color2 hover:text-white"
                      onClick={() => setIsAddingLecture(true)}>
                      {t("admin.courses.addLecture")}
                    </DropdownMenuItem>
                  )}
                  {canManageLectures && canManageCourses && (
                    <DropdownMenuSeparator />
                  )}
                  {canManageCourses && (
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/dashboard/courses/${id}/exams/add`)
                      }
                      className="hover:cursor-pointer hover:bg-color2 hover:text-white">
                      {t("admin.courses.addExam")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : isAddingLecture ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsAddingLecture(false);
              }}>
              {t("admin.courses.cancel")}
            </Button>
          ) : null}
        </div>
      </div>
      {isAddingLecture && canManageLectures && (
        <AddLectureForm
          courseId={id}
          onClose={() => setIsAddingLecture(false)}
        />
      )}
      {!isAddingLecture && (
        <div className='flex flex-col gap-2'>
          {items.map((item) => (
            <CourseItem
              key={item.id}
              item={item}
              courseId={id}
              canManageCourses={canManageCourses}
              canManageLectures={canManageLectures}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseItem({
  item,
  courseId,
  canManageCourses,
  canManageLectures,
}: {
  item: SingleCourseItem;
  courseId: string;
  canManageCourses: boolean;
  canManageLectures: boolean;
}) {
  const isExam = item.type === "Exam";
  const canOpen = isExam ? canManageCourses : canManageLectures;

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2 rounded border border-color2/25 bg-color2/10 text-color2">
      <div className="min-w-0 flex-1 p-2">
        <p className="truncate">{item.title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pe-2">
        <Badge className="h-5">{item.type}</Badge>
        {canOpen && (
          <Link
            to={`/dashboard/courses/${courseId}/${
              isExam ? "exams" : "lectures"
            }/${item.id}`}
          >
            <Edit2 className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function AddLectureForm({
  courseId,
  onClose,
}: {
  courseId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const createLectureMutation = useCreateLecture({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Lecture added",
          description: data.message,
        });
        onClose();
        qc.invalidateQueries({
          queryKey: getGetCourseQueryKey(courseId),
        });
      },
    },
  });

  const form = useForm({
    resolver: zodResolver(AddLectureRequest),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = (data: AddLectureRequest) => {
    createLectureMutation.mutate({ courseId, data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          className='p-2 space-y-2 border-2 border-color2/30 rounded'
          disabled={createLectureMutation.isPending}>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-color2'>Title</FormLabel>
                <FormControl>
                  <Input type='text' className='text-color2' {...field} />
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

export default DashboardCoursePage;
