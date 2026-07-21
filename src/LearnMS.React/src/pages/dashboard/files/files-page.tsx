import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import AssetsList from "@/pages/dashboard/files/assets-list";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

const FilesPage = () => {
  const { t } = useTranslation();

  return (
    <DashboardPageShell
      title={t("admin.files.title")}
      description={t("admin.files.description")}
      icon={FileText}
      fullWidth
    >
      <AssetsList />
    </DashboardPageShell>
  );
};

export default FilesPage;
