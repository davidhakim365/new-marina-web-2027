import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import QuestionsList from "@/pages/dashboard/questions/questions-list";
import { useModalStore } from "@/store/use-modal-store";
import { HelpCircle, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const QuestionsPage = () => {
  const { t } = useTranslation();
  const { openModal } = useModalStore();

  return (
    <DashboardPageShell
      title={t("admin.questions.title")}
      description={t("admin.questions.description")}
      icon={HelpCircle}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-color2/20"
            onClick={() => openModal("add-multiple-question-modal")}
          >
            <Plus className="me-2 h-4 w-4" />
            {t("admin.questions.multipleChoice")}
          </Button>
          <Button
            variant="outline"
            className="border-color2/20"
            onClick={() => openModal("add-value-question-modal")}
          >
            <Plus className="me-2 h-4 w-4" />
            {t("admin.questions.number")}
          </Button>
          <Button
            className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90"
            onClick={() => openModal("add-essay-question-modal")}
          >
            <Plus className="me-2 h-4 w-4" />
            {t("admin.questions.essay")}
          </Button>
        </div>
      }
      fullWidth
    >
      <DashboardCard padding="sm">
        <QuestionsList />
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default QuestionsPage;
