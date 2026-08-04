import {
  UpdateAssistantRequest,
  useAssistantQuery,
  useClaimAssistantIncomesMutation,
  useDeleteAssistantMutation,
  useGetAssistantIncomesQuery,
  usePermissionsQuery,
  useUpdateAssistantMutation,
} from "@/api/assistants-api";
import Confirmation from "@/components/confirmation";
import { ImageUploadField } from "@/components/image-upload-field";
import Loading from "@/components/loading/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPermissionMeta,
  groupPermissions,
} from "@/lib/assistant-permissions";
import { toast } from "@/lib/utils";
import { assistantIncomesColumns } from "@/pages/dashboard/assistants/columns";
import { AssistantIncomesDataTable } from "@/pages/dashboard/assistants/data-table";
import { Assistant, assistantDisplayName } from "@/types/assistants";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaginationState, RowSelectionState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FaMoneyBillAlt, FaMoneyCheckAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { z } from "zod";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AssistantDetailsPage = () => {
  const { assistantId } = useParams();
  const { data: assistant, isLoading } = useAssistantQuery({
    id: assistantId!,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 text-foreground">
      <Tabs
        defaultValue="details"
        className="p-0 border-2 shadow-md rounded-xl shadow-primary border-secondary"
      >
        <TabsList className="m-0 h-auto w-full justify-start overflow-x-auto shadow-sm shadow-primary">
          <TabsTrigger value="details" className="shrink-0">Details</TabsTrigger>
          <TabsTrigger value="incomes" className="shrink-0">Incomes</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="px-4 py-6 sm:px-[10%] lg:px-[20%]">
          <AssistantDetails assistant={assistant!.data} />
        </TabsContent>
        <TabsContent value="incomes" className="p-6">
          <AssistantIncomes assistant={assistant!.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function AssistantDetails({ assistant }: { assistant: Assistant }) {
  const { t } = useTranslation();
  const { data: permissions, isLoading } = usePermissionsQuery();
  const deleteAssistantMutation = useDeleteAssistantMutation();
  const updateAssistantMutation = useUpdateAssistantMutation();
  const [permissionSearch, setPermissionSearch] = useState("");

  const permissionKeys = permissions?.data.items ?? [];

  const PermissionsSchema = permissionKeys.reduce(
    (acc, value) => ({ ...acc, [value]: z.boolean() }),
    {}
  );

  const PasswordPermissionsSchema = z.object({
    fullName: z.string().min(2),
    password: z
      .string()
      .optional()
      .transform((val) => (val ? val : undefined)),
    code: z.string().optional(),
    profilePicture: z.string().optional(),
    ...PermissionsSchema,
  });

  const permissionsValues = permissionKeys.reduce(
    (acc, value) => ({
      ...acc,
      [value]: assistant.permissions.includes(value),
    }),
    {}
  );

  const form = useForm<z.infer<typeof PasswordPermissionsSchema>>({
    resolver: zodResolver(PasswordPermissionsSchema),
    values: {
      fullName: assistant.fullName ?? "",
      password: "",
      code: assistant.code ?? "",
      profilePicture: assistant.profilePicture ?? "",
      ...permissionsValues,
    },
  });

  const groupedPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    const filtered = permissionKeys.filter((key) => {
      if (!query) return true;
      const meta = getPermissionMeta(key);
      const title = t(meta.titleKey, { defaultValue: key }).toLowerCase();
      const description = meta.descriptionKey
        ? t(meta.descriptionKey, { defaultValue: "" }).toLowerCase()
        : "";
      return (
        key.toLowerCase().includes(query) ||
        title.includes(query) ||
        description.includes(query)
      );
    });
    return groupPermissions(filtered);
  }, [permissionKeys, permissionSearch, t]);

  const watchedValues = form.watch();
  const enabledCount = permissionKeys.filter((key) =>
    Boolean((watchedValues as Record<string, unknown>)[key])
  ).length;

  const setGroupEnabled = (keys: string[], enabled: boolean) => {
    for (const key of keys) {
      form.setValue(key as any, enabled, { shouldDirty: true });
    }
  };

  const onDeleting = () => {
    deleteAssistantMutation.mutate(
      { id: assistant.id },
      {
        onSuccess: () => {
          toast({
            title: "Assistant deleted",
            description: "Assistant deleted successfully",
          });
        },
      }
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  const onSubmit = (data: z.infer<typeof PasswordPermissionsSchema>) => {
    const { password, code, fullName, profilePicture, ...perms } = data;
    const previousPicture = assistant.profilePicture ?? "";
    const nextPicture = profilePicture ?? "";
    const request = UpdateAssistantRequest.parse({
      fullName,
      password,
      code,
      profilePicture: nextPicture || undefined,
      clearProfilePicture: !nextPicture && !!previousPicture,
      permissions: permissionKeys.filter((p) => (perms as any)[p]),
    });
    updateAssistantMutation.mutate(
      { id: assistant.id, data: request },
      {
        onSuccess: () => {
          toast({
            title: "Assistant updated",
            description: "Assistant updated successfully",
          });
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          disabled={updateAssistantMutation.isPending}
          className="flex flex-col gap-3"
        >
          <div className="mb-2 flex items-center gap-3">
            <Avatar className="size-14 border border-color2/20">
              <AvatarImage src={assistant.profilePicture ?? undefined} />
              <AvatarFallback>
                {initials(assistantDisplayName(assistant))}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{assistantDisplayName(assistant)}</p>
              <p className="text-sm text-muted-foreground">{assistant.email}</p>
            </div>
          </div>
          <FormField
            name="fullName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="profilePicture"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile photo (ImgBB)</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="code"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assistant code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Leave blank to keep current"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {t("admin.assistants.permissionsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("admin.assistants.permissionsHint", {
                    enabled: enabledCount,
                    total: permissionKeys.length,
                  })}
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  placeholder={t("admin.assistants.searchPermissions")}
                  className="ps-9"
                />
              </div>
            </div>

            {groupedPermissions.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                {t("admin.assistants.noPermissionsMatch")}
              </p>
            ) : (
              groupedPermissions.map((group) => {
                const groupKeys = group.items.map((item) => item.key);
                const enabledInGroup = groupKeys.filter((key) =>
                  Boolean((watchedValues as Record<string, unknown>)[key])
                ).length;

                return (
                  <div
                    key={group.group}
                    className="overflow-hidden rounded-xl border border-color2/15"
                  >
                    <div className="flex flex-col gap-2 border-b border-color2/10 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{t(group.titleKey)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("admin.assistants.groupEnabled", {
                            enabled: enabledInGroup,
                            total: groupKeys.length,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setGroupEnabled(groupKeys, true)}
                        >
                          {t("admin.assistants.enableAll")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setGroupEnabled(groupKeys, false)}
                        >
                          {t("admin.assistants.disableAll")}
                        </Button>
                      </div>
                    </div>
                    <div className="divide-y divide-color2/10">
                      {group.items.map((item) => (
                        <FormField
                          key={item.key}
                          control={form.control}
                          name={item.key as any}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start justify-between gap-4 px-4 py-3">
                              <div className="min-w-0 space-y-1">
                                <FormLabel className="text-base font-medium">
                                  {t(item.titleKey, { defaultValue: item.key })}
                                </FormLabel>
                                {item.descriptionKey ? (
                                  <FormDescription>
                                    {t(item.descriptionKey)}
                                  </FormDescription>
                                ) : null}
                                <p className="text-[11px] text-muted-foreground/80">
                                  {item.key}
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-4">
            <Confirmation
              button={
                <Button variant="destructive" className="me-auto">
                  Delete
                </Button>
              }
              title="Are you sure you want to delete this assistant?"
              description="This action cannot be undone."
              onConfirm={onDeleting}
            />
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Form>
  );
}

function AssistantIncomes({ assistant }: { assistant: Assistant }) {
  const claimAssistantIncomesMutation = useClaimAssistantIncomesMutation();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: incomes, isLoading } = useGetAssistantIncomesQuery({
    id: assistant.id,
    page: pageIndex + 1,
    pageSize,
  });

  if (isLoading) {
    return <Loading />;
  }

  const onClaiming = () => {
    claimAssistantIncomesMutation.mutate(
      { id: assistant.id },
      {
        onSuccess: (res) => {
          toast({
            title: "Incomes claimed",
            description: res.message,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="text-primary">
          <CardTitle className="flex items-center justify-between p-2 text-4xl">
            Total Income <FaMoneyCheckAlt />
          </CardTitle>
          <CardContent className="text-3xl">
            {incomes?.data.totalIncome} LE
          </CardContent>
        </Card>
        <Card className="text-primary">
          <CardTitle className="flex items-center justify-between p-2 text-4xl">
            Unclaimed Income <FaMoneyBillAlt />
          </CardTitle>
          <CardContent className="flex justify-between text-3xl">
            {incomes?.data.unClaimedIncome} LE
            <Button
              disabled={claimAssistantIncomesMutation.isPending}
              onClick={onClaiming}
              variant="outline"
              className="transition-all duration-300 hover:shadow-md hover:shadow-primary hover:text-primary"
            >
              Claim all
            </Button>
          </CardContent>
        </Card>
      </div>

      <AssistantIncomesDataTable
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pagination={{
          hasNextPage: incomes?.data.data.hasNextPage!,
          hasPreviousPage: incomes?.data.data.hasPreviousPage!,
          pageIndex,
          pageSize,
          pageCount: incomes?.data.data.totalCount!,
        }}
        setPagination={setPagination}
        data={incomes?.data.data.items!}
        columns={assistantIncomesColumns}
      />
    </div>
  );
}

export default AssistantDetailsPage;
