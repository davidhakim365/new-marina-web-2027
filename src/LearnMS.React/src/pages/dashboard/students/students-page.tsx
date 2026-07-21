import { useStudentsStatisticsQuery } from "@/api/students-api";
import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
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
import { StudentLevel } from "@/generated/model";
import useDownloadFile from "@/hooks/useDownloadFile";
import { useStudentsColumns } from "@/pages/dashboard/students/columns";
import { useModalStore } from "@/store/use-modal-store";
import { PaginationState } from "@tanstack/react-table";
import {
  Download,
  Globe2,
  Laptop,
  Loader2,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  ADMIN_LEVEL_I18N_KEYS,
  STUDENT_LEVEL_ORDER,
} from "@/lib/student-levels";

const StudentsPage = () => {
  const { t } = useTranslation();
  const { openModal } = useModalStore();
  const { download, isDownloading } = useDownloadFile();
  const [searchParams, setSearchParams] = useSearchParams({});
  const studentsColumns = useStudentsColumns();

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: parseInt(searchParams.get("page") || "1") - 1,
    pageSize: parseInt(searchParams.get("pageSize") || "10"),
  });
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [level, setLevel] = useState(searchParams.get("level") ?? "all");
  const { data: students, isLoading } = useGetAllStudents({
    page: pageIndex + 1,
    pageSize,
    search,
    level: level as StudentLevel,
  });
  const { data: statsResponse, isLoading: statsLoading } =
    useStudentsStatisticsQuery();
  const stats = statsResponse?.data;

  const onExport = async () => {
    await download(`/api/students/export?level=${level}`, "students.csv");
  };

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      ...(search ? { search } : {}),
      ...(level ? { level } : {}),
    });
  }, [pageIndex, pageSize, search, level]);

  const levelCounts = useMemo(() => {
    const map: Record<string, number> = {
      Level0: 0,
      Level1: 0,
      Level2: 0,
      Level3: 0,
      Level4: 0,
      Level5: 0,
    };
    for (const bucket of stats?.byLevel ?? []) {
      map[bucket.level] = bucket.count;
    }
    return map;
  }, [stats?.byLevel]);

  const topGovernorates = (stats?.byGovernorate ?? []).slice(0, 6);

  return (
    <DashboardPageShell
      title={t("admin.students.title")}
      description={t("admin.students.description")}
      icon={Users}
      actions={
        <Button
          onClick={() => openModal("add-student-modal")}
          className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.students.addStudent")}
        </Button>
      }
      fullWidth
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard padding="sm" spotlight>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("admin.students.stats.total")}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {statsLoading ? "—" : stats?.totalStudents ?? 0}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-color2/10 text-color2">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </DashboardCard>
        <DashboardCard padding="sm" spotlight>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("admin.students.stats.linkedDevices")}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {statsLoading ? "—" : stats?.deviceLinkedCount ?? 0}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Laptop className="h-5 w-5" />
            </div>
          </div>
        </DashboardCard>
        <DashboardCard padding="sm" className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("admin.students.stats.byLevel")}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STUDENT_LEVEL_ORDER.map((key) => (
                <div
                  key={key}
                  className="rounded-lg border border-color2/10 bg-muted/30 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{t(ADMIN_LEVEL_I18N_KEYS[key])}</p>
                  <p className="text-lg font-semibold">{levelCounts[key] ?? 0}</p>
                </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard>
        <div className="mb-3 flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-color2" />
          <h3 className="font-semibold">{t("admin.students.stats.byGovernorate")}</h3>
        </div>
        {statsLoading ? (
          <Loading />
        ) : topGovernorates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("admin.students.stats.noGovernorateData")}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topGovernorates.map((bucket) => (
              <div
                key={bucket.governorate}
                className="flex items-center justify-between rounded-lg border border-color2/10 px-3 py-2"
              >
                <span className="truncate text-sm">{bucket.governorate}</span>
                <span className="ms-2 shrink-0 font-semibold">{bucket.count}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={t("admin.students.searchPlaceholder")}
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={isDownloading}
              variant="outline"
              className="border-color2/20"
              onClick={onExport}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ms-2">{t("admin.students.export")}</span>
            </Button>
            <Select onValueChange={setLevel} value={level}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t("admin.students.columns.level")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.levels.all")}</SelectItem>
                {STUDENT_LEVEL_ORDER.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {t(ADMIN_LEVEL_I18N_KEYS[lvl])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <DataTable
            pagination={{
              hasNextPage: students?.data!.hasNextPage!,
              hasPreviousPage: students?.data!.hasPreviousPage!,
              pageCount: students?.data!.totalCount!,
              pageIndex,
              pageSize,
            }}
            rowCount={students?.data!.totalCount!}
            setPagination={setPagination}
            data={students?.data!.items!}
            columns={studentsColumns}
          />
        )}
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default StudentsPage;
