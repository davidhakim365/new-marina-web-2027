import { openLectureHomeworkPdf } from "@/api/lectures-api";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function HomeworkPdfLink({
  courseId,
  lectureId,
  studentId,
  submitted,
  fileName,
}: {
  courseId: string;
  lectureId: string;
  studentId: string;
  submitted?: boolean;
  fileName?: string | null;
}) {
  const { t } = useTranslation();
  const [opening, setOpening] = useState(false);

  if (!submitted) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("lectures.homeworkNotSubmitted")}
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={opening}
      onClick={async () => {
        setOpening(true);
        try {
          await openLectureHomeworkPdf({
            courseId,
            lectureId,
            studentId,
            fileName,
          });
        } finally {
          setOpening(false);
        }
      }}
    >
      {opening ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      {t("lectures.viewHomework")}
    </Button>
  );
}
