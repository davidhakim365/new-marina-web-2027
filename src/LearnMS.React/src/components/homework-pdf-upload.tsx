import {
  openLectureHomeworkPdf,
  useSubmitLectureHomeworkMutation,
} from "@/api/lectures-api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  getGetLectureQueryKey,
  getGetStudentCourseDetailsQueryKey,
} from "@/generated/api";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Replace, Upload } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

const MAX_HOMEWORK_BYTES = 15 * 1024 * 1024;

export type HomeworkStatusProps = {
  courseId: string;
  lectureId: string;
  homeworkScore?: number | null;
  homeworkFullMark?: number | null;
  homeworkSubmitted?: boolean;
  homeworkFileName?: string | null;
  homeworkSubmittedAt?: string | null;
};

export function HomeworkPdfUpload({
  courseId,
  lectureId,
  homeworkScore,
  homeworkFullMark,
  homeworkSubmitted,
  homeworkFileName,
  homeworkSubmittedAt,
}: HomeworkStatusProps) {
  const { t, i18n } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const submitMutation = useSubmitLectureHomeworkMutation();

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast({
        title: t("lectures.homeworkInvalidFile"),
        description: t("lectures.homeworkPdfOnly"),
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_HOMEWORK_BYTES) {
      toast({
        title: t("lectures.homeworkInvalidFile"),
        description: t("lectures.homeworkTooLarge"),
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(
      { courseId, lectureId, file },
      {
        onSuccess: (res) => {
          toast({
            title: t("lectures.homeworkUploaded"),
            description: res.message,
          });
          qc.invalidateQueries({
            queryKey: getGetLectureQueryKey(courseId, lectureId),
          });
          qc.invalidateQueries({
            queryKey: getGetStudentCourseDetailsQueryKey(courseId),
          });
        },
      }
    );
  };

  const submittedAtLabel = homeworkSubmittedAt
    ? new Date(homeworkSubmittedAt).toLocaleString(
        i18n.language === "ar" ? "ar-EG" : "en-GB",
        { dateStyle: "medium", timeStyle: "short" }
      )
    : null;

  return (
    <div className="p-4 space-y-3 border rounded-xl bg-card border-border/60">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary">
          <FileUp className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-base font-semibold sm:text-lg">
            {t("lectures.homeworkPdf")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("lectures.homeworkPdfHint")}
          </p>
        </div>
      </div>

      {homeworkSubmitted && (
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium truncate">
              {homeworkFileName || t("lectures.homeworkSubmitted")}
            </p>
            {submittedAtLabel && (
              <p className="text-xs text-muted-foreground">{submittedAtLabel}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              void openLectureHomeworkPdf({
                courseId,
                lectureId,
                fileName: homeworkFileName,
              })
            }
          >
            {t("lectures.viewHomework")}
          </Button>
        </div>
      )}

      {homeworkScore != null && (
        <p className="text-sm font-medium">
          {t("lectures.homeworkMark")}: {homeworkScore}
          {homeworkFullMark != null ? ` / ${homeworkFullMark}` : ""}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={submitMutation.isPending}
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={homeworkSubmitted ? "outline" : "default"}
        disabled={submitMutation.isPending}
        onClick={() => inputRef.current?.click()}
        className="w-full sm:w-auto"
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("lectures.homeworkUploading")}
          </>
        ) : homeworkSubmitted ? (
          <>
            <Replace className="w-4 h-4" />
            {t("lectures.replaceHomework")}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {t("lectures.uploadHomework")}
          </>
        )}
      </Button>
    </div>
  );
}
