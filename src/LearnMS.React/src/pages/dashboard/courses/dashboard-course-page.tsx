import { AddLectureRequest } from "@/api/lectures-api";
import Confirmation from "@/components/confirmation";
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
import { GetDashboardCourseResult, SingleCourseItem } from "@/generated/model";
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
        <div className="flex gap-2">
          <Confirmation
            disabled={deleteCourseMutation.isPending}
            description={t("admin.courses.deleteConfirm")}
            title={t("admin.courses.deleteTitle")}
            onConfirm={onDeleting}
            button={
              <Button variant="destructive" disabled={deleteCourseMutation.isPending}>
                {t("admin.common.delete")}
              </Button>
            }
          />
          <Button
            onClick={onPublishing}
            className="border border-color2/40 bg-gradient-to-r from-color1 to-color2 text-white shadow-md shadow-color2/20 hover:opacity-90"
          >
            {course.isPublished
              ? t("admin.courses.unpublish")
              : t("admin.courses.publish")}
          </Button>
        </div>
      }
    >
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <CourseDetailsForm {...course} />
        <CourseContentForm {...course} />
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
    <div className='px-2'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-2 p-2'>
          <fieldset
            className='flex items-center gap-2 p-2 text-xl'
            disabled={updateCourseMutation.isPending}>
            <Settings2 className='text-color2 bg-color2/15 rounded-[50%] w-10 h-10 p-1' />
            Course Details
            {form.formState.isDirty && (
              <div className='space-x-1 ms-auto'>
                <Button className='bg-color2/50'>Save</Button>
                <Button
                  variant='outline'
                  type='button'
                  className='border-color2/20'
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

function CourseContentForm({ items, id }: GetDashboardCourseResult) {
  const { t } = useTranslation();
  const [isAddingLecture, setIsAddingLecture] = useState(false);
  const navigate = useNavigate();

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div className='flex items-center justify-between text-xl'>
        <div className='flex items-center gap-2'>
          <ListCollapse className='text-color2 bg-color2/15 rounded-[50%] w-10 h-10 p-1' />
          {t("admin.courses.content")}
        </div>
        <div className='flex items-center justify-center gap-2'>
          {!isAddingLecture ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className='hover:bg-color2 hover:text-white hover:cursor-pointer'
                    onClick={() => setIsAddingLecture(true)}>
                    {t("admin.courses.addLecture")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(`/dashboard/courses/${id}/exams/add`)
                    }
                    className='hover:bg-color2 hover:text-white hover:cursor-pointer'>
                    {t("admin.courses.addExam")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant='destructive'
              onClick={() => {
                setIsAddingLecture(false);
              }}>
              {t("admin.courses.cancel")}
            </Button>
          )}
        </div>
      </div>
      {isAddingLecture && (
        <AddLectureForm
          courseId={id}
          onClose={() => setIsAddingLecture(false)}
        />
      )}
      {!isAddingLecture && (
        <div className='flex flex-col gap-2'>
          {items.map((item) => (
            <CourseItem key={item.id} item={item} courseId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseItem({
  item,
  courseId,
}: {
  item: SingleCourseItem;
  courseId: string;
}) {
  return (
    <div className='flex items-center justify-between w-full gap-2 text-color2 bg-color2/10 border border-color2/25 rounded'>
      <div className='flex gap-2'>

        <div className='p-2'>{item.title}</div>
      </div>
      <div className='flex items-center gap-2'>
        <Badge className='h-5'>{item.type}</Badge>
        <Link
          className='me-2'
          to={`/dashboard/courses/${courseId}/${
            item.type === "Exam" ? "exams" : "lectures"
          }/${item.id}`}>
          <Edit2 className='w-4 h-4' />
        </Link>
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
