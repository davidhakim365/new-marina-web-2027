import { useAssistantsQuery } from "@/api/assistants-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useModalStore } from "@/store/use-modal-store";
import { Assistant, assistantDisplayName } from "@/types/assistants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit2, Plus, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AssistantsPage = () => {
  const { t } = useTranslation();
  const { data: assistants, isLoading } = useAssistantsQuery();
  const { openModal } = useModalStore();

  if (isLoading) {
    return <Loading />;
  }

  const items = assistants?.data?.items ?? [];

  return (
    <DashboardPageShell
      title={t("admin.nav.assistants")}
      description={t("admin.assistants.description")}
      icon={Shield}
      decorative
      actions={
        <Button
          onClick={() => openModal("add-assistant-modal")}
          className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.assistants.add")}
        </Button>
      }
    >
      <div className="grid gap-4">
        {items.map((assistant) => (
          <AssistantListItem key={assistant.id} assistant={assistant} />
        ))}
      </div>
    </DashboardPageShell>
  );
};

function AssistantListItem({ assistant }: { assistant: Assistant }) {
  const { t } = useTranslation();
  const name = assistantDisplayName(assistant);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <DashboardCard padding="sm" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-color2/10"
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-color2/20 shadow-md shadow-color2/10">
            <AvatarImage src={assistant.profilePicture ?? undefined} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-color1 to-color2 text-white">
              {initials || <Shield className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{assistant.email}</span>
              <span>·</span>
              <span>
                {t("admin.assistants.code")} {assistant.code || "—"}
              </span>
              <span>·</span>
              <span>
                {assistant.permissions?.length ?? 0}{" "}
                {t("admin.assistants.permissions")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline" size="sm" className="border-color2/20">
                {t("admin.assistants.permissions")}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit space-y-1">
              {assistant.permissions?.map((permission) => (
                <Badge
                  key={permission}
                  variant="secondary"
                  className="mr-1 bg-color2/10 text-color2"
                >
                  {permission}
                </Badge>
              ))}
            </HoverCardContent>
          </HoverCard>
          <Link to={`/dashboard/assistants/${assistant.id}`}>
            <Button size="icon" variant="outline" className="border-color2/20">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}

export default AssistantsPage;
