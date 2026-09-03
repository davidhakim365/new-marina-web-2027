import
  {
    getLessonVideoUploadPolicy,
    saveLessonVideoId,
    UpdateLessonRequest,
    uploadVideoToVdoCipher,
    useDeleteLessonMutation,
    useUpdateLessonMutation,
    waitForVideoReady,
  } from "@/api/lessons-api";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import
  {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useGetLesson } from "@/generated/api";
import { GetDashboardLessonResult } from "@/generated/model";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ListCollapse, Settings2, Upload, Video } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

type UploadPhase =
  | "idle"
  | "preparing"
  | "uploading"
  | "saving"
  | "processing"
  | "complete"
  | "error";

const LessonDetailsPage = () => {
  const { courseId, lectureId, lessonId } = useParams();
  const navigate = useNavigate();

  const { data: lesson, isLoading, isError } = useGetLesson(
    courseId!,
    lectureId!,
    lessonId!
  );

  const deleteLessonMutation = useDeleteLessonMutation();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  const onDeleting = () => {
    deleteLessonMutation.mutate(
      {
        lectureId: lectureId!,
        courseId: courseId!,
        lessonId: lessonId!,
      },
      {
        onSuccess() {
          navigate(`/dashboard/courses/${courseId}/lectures/${lectureId}`, {
            replace: true,
          });
          toast({
            title: "Deleting",
            description: "Successfully deleted the lesson",
          });
        },
      }
    );
  };

  if (isError || lesson?.data?.$type === "GetStudentLessonResult") {
    return;
  }

  return (
    <DashboardPageShell
      title="Lesson Setup"
      description={lesson?.data?.title}
      icon={Video}
      fullWidth
      actions={
        <Confirmation
          button={
            <Button variant="destructive" className="w-full sm:w-auto">
              Delete
            </Button>
          }
          title="Are you sure you want to delete this lesson?"
          description="This action cannot be undone."
          onConfirm={onDeleting}
        />
      }
    >
      <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <DashboardCard padding="sm" className="min-w-0">
          <LessonDetailsContent
            {...lesson?.data!}
            courseId={courseId!}
            lectureId={lectureId!}
          />
        </DashboardCard>
        <DashboardCard padding="sm" className="min-w-0">
          <LessonVideo
            lesson={lesson?.data!}
            lessonId={lessonId!}
            lectureId={lectureId!}
            courseId={courseId!}
          />
        </DashboardCard>
      </div>
    </DashboardPageShell>
  );
};

function LessonDetailsContent({
  id,
  description,
  videoId,
  title,
  expirationHours,
  renewalPrice,
  courseId,
  lectureId,
}: GetDashboardLessonResult & { lectureId: string; courseId: string }) {
  const updateLessonMutation = useUpdateLessonMutation();

  const form = useForm<UpdateLessonRequest>({
    resolver: zodResolver(UpdateLessonRequest),
    defaultValues: {
      description,
      title,
      expirationHours,
      videoId: videoId ?? "",
      renewalPrice,
    },
    values: {
      description,
      title,
      expirationHours,
      renewalPrice,
      videoId: videoId ?? "",
    },
  });

  const onSubmit = (data: UpdateLessonRequest) => {
    updateLessonMutation.mutate(
      { lectureId, lessonId: id, courseId, data },
      {
        onSuccess: (data) => {
          toast({
            title: "Lesson updated",
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
            disabled={updateLessonMutation.isPending}>
            <div className="flex min-w-0 items-center gap-2 text-lg sm:text-xl">
              <Settings2 className="h-9 w-9 shrink-0 rounded-full bg-color2/15 p-1 text-color2" />
              <span className="truncate">Lesson Details</span>
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
                  <Textarea className='text-color2' {...field} />
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
                <FormLabel className='text-color2'>Renewal Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='expirationHours'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>
                  Expiration Hours
                </FormLabel>
                <FormControl>
                  <Input type='number' className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='videoId'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>
                  Video Id (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type='string'
                    className='text-color2'
                    placeholder='Paste VdoCipher video ID here'
                    {...field}
                  />
                </FormControl>
                <FormDescription className='text-color2/70'>
                  Leave empty and upload below, or paste an existing VdoCipher
                  video ID.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

function LessonVideo({
  lessonId,
  courseId,
  lectureId,
  lesson,
}: {
  lessonId: string;
  lectureId: string;
  courseId: string;
  lesson: GetDashboardLessonResult;
}) {
  const qc = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadPhase("idle");
    setUploadProgress(0);
    setStatusMessage("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const refreshLesson = () => {
    qc.invalidateQueries({ queryKey: ["lesson", { id: lessonId }] });
    qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
    qc.invalidateQueries({ queryKey: ["lecture", { id: lectureId }] });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please choose a video file first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadPhase("preparing");
    setUploadProgress(0);
    setStatusMessage("Preparing upload...");

    try {
      setUploadPhase("preparing");
      setStatusMessage("Getting VdoCipher upload credentials...");

      const policy = await getLessonVideoUploadPolicy({
        courseId,
        lectureId,
        lessonId,
      });

      setUploadPhase("uploading");
      setStatusMessage("Uploading to VdoCipher...");

      await uploadVideoToVdoCipher({
        file: selectedFile,
        policy,
        onProgress: (percent) => {
          setUploadProgress(percent);
          setStatusMessage(`Uploading to VdoCipher... ${percent}%`);
        },
      });

      setUploadPhase("saving");
      setUploadProgress(100);
      setStatusMessage("Saving video ID to lesson...");

      await saveLessonVideoId({
        courseId,
        lectureId,
        lessonId,
        videoId: policy.videoId,
      });

      setUploadPhase("processing");
      setStatusMessage("Video uploaded. Processing on VdoCipher...");

      await waitForVideoReady({
        courseId,
        lectureId,
        lessonId,
        maxAttempts: 60,
        intervalMs: 5000,
      });

      setUploadPhase("complete");
      setStatusMessage("Video is ready.");
      setSelectedFile(null);
      refreshLesson();

      toast({
        title: "Video uploaded successfully",
        description: `Video ID: ${policy.videoId}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Please try again.";
      setUploadPhase("error");
      setStatusMessage(message);
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const showProgress =
    uploadPhase === "preparing" ||
    uploadPhase === "uploading" ||
    uploadPhase === "saving" ||
    uploadPhase === "processing";

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center gap-2 text-lg sm:text-xl">
        <ListCollapse className="h-9 w-9 shrink-0 rounded-full bg-color2/15 p-1 text-primary" />
        <span className="truncate">Lesson Content</span>
      </div>

      <div className="space-y-4 rounded-xl border-2 border-color2/20 bg-color2/10 p-3 sm:p-4">
        <p className="text-sm text-color2/80">
          Upload a video directly to VdoCipher, or paste a video ID in the
          form on the left.
        </p>

        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 transition-colors sm:p-8 ${
            isDragActive
              ? "border-color2 bg-color2/20"
              : "border-color2/40 hover:border-color2/70 hover:bg-color2/10"
          } ${isUploading ? "cursor-not-allowed opacity-60" : ""}`}>
          <input {...getInputProps()} />
          <Video className="h-10 w-10 text-color2/60" />
          {selectedFile ? (
            <div className="w-full min-w-0 text-center">
              <p className="break-all font-medium text-color2">{selectedFile.name}</p>
              <p className="text-sm text-color2/60">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium text-color2">
                {isDragActive
                  ? "Drop the video here"
                  : "Drag & drop a video, or click to browse"}
              </p>
              <p className="text-sm text-color2/60">MP4, MOV, AVI and other video formats</p>
            </div>
          )}
        </div>

        {showProgress && (
          <div className="space-y-2">
            <div className="flex flex-col gap-1 text-sm text-color2 sm:flex-row sm:justify-between">
              <span className="break-words">{statusMessage}</span>
              {uploadPhase === "uploading" && <span className="shrink-0">{uploadProgress}%</span>}
            </div>
            <Progress
              value={
                uploadPhase === "uploading"
                  ? uploadProgress
                  : uploadPhase === "processing" || uploadPhase === "saving"
                    ? 100
                    : uploadPhase === "preparing"
                      ? 5
                      : 0
              }
              className="h-2"
            />
            {uploadPhase === "processing" && (
              <p className="animate-pulse text-xs text-color2/60">
                VdoCipher is encoding your video. This may take a few minutes...
              </p>
            )}
          </div>
        )}

        {uploadPhase === "error" && (
          <p className="break-words text-sm text-destructive">{statusMessage}</p>
        )}

        {uploadPhase === "complete" && (
          <p className="text-sm text-green-600">{statusMessage}</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full whitespace-normal bg-color2/80 hover:bg-color2 sm:w-auto sm:whitespace-nowrap">
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload to VdoCipher"}
          </Button>
          {selectedFile && !isUploading && (
            <Button
              variant="outline"
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setSelectedFile(null);
                setUploadPhase("idle");
                setUploadProgress(0);
                setStatusMessage("");
              }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {lesson.videoOTP?.playbackInfo && (
        <div className="aspect-video w-full overflow-clip rounded-xl">
          <iframe
            src={`https://player.vdocipher.com/v2/?otp=${
              lesson.videoOTP!.otp
            }&playbackInfo=${lesson.videoOTP.playbackInfo}`}
            allowFullScreen
            className="h-full w-full object-cover"
            allow="encrypted-media"></iframe>
        </div>
      )}
    </div>
  );
}

export default LessonDetailsPage;
