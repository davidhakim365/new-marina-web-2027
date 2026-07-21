import Loading from "@/components/loading/loading";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllStudents } from "@/generated/api";
import { SingleStudent, StudentLevel } from "@/generated/model";
import { Search, User, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const levelMap: Record<StudentLevel, string> = {
  Level0: "2nd Prep",
  Level1: "3rd Prep",
  Level2: "1st Secondary",
  Level3: "2nd Secondary",
};

const levelKeys: Record<
  StudentLevel,
  | "admin.levels.level0"
  | "admin.levels.level1"
  | "admin.levels.level2"
  | "admin.levels.level3"
> = {
  Level0: "admin.levels.level0",
  Level1: "admin.levels.level1",
  Level2: "admin.levels.level2",
  Level3: "admin.levels.level3",
};

type StudentPickerProps = {
  selectedStudent: SingleStudent | null;
  onSelectStudent: (student: SingleStudent) => void;
  onClearStudent: () => void;
};

export function StudentPicker({
  selectedStudent,
  onSelectStudent,
  onClearStudent,
}: StudentPickerProps) {
  const { t } = useTranslation();
  const [studentSearch, setStudentSearch] = useState("");

  const { data: studentsData, isLoading: studentsLoading } = useGetAllStudents(
    { page: 1, pageSize: 50, search: studentSearch },
    { query: { enabled: !selectedStudent } }
  );

  const handleSelectStudent = (studentId: string) => {
    const student = studentsData?.data?.items?.find((s) => s.id === studentId);
    if (student) {
      onSelectStudent(student);
      setStudentSearch("");
    }
  };

  return (
    <DashboardCard>
      <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <User className="h-5 w-5 text-color2" />
        {t("admin.studentPicker.title")}
      </div>

      {selectedStudent ? (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-color2/10 bg-color2/5 p-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="font-medium">{selectedStudent.fullName}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t("admin.studentPicker.id")}: {selectedStudent.studentCode}
              </span>
              <Badge variant="outline" className="border-color2/20">
                {t(levelKeys[selectedStudent.level])}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearStudent}
            className="gap-2 border-color2/20"
          >
            <X className="h-4 w-4" />
            {t("admin.studentPicker.change")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={t("admin.studentPicker.searchPlaceholder")}
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>
          {studentsLoading ? (
            <Loading />
          ) : (
            <Select onValueChange={handleSelectStudent}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue
                  placeholder={t("admin.studentPicker.choosePlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {studentsData?.data?.items?.length ? (
                  studentsData.data.items.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} — {student.studentCode} (
                      {t(levelKeys[student.level])})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {studentSearch
                      ? t("admin.studentPicker.noStudents")
                      : t("admin.studentPicker.typeToSearch")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
