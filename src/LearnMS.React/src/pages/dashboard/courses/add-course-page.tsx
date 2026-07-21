import { AddCourseRequest, useAddCourseMutation } from "@/api/courses-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

const AddCoursePage = () => {
  const { t } = useTranslation();
  const addCourseMutation = useAddCourseMutation();
  const navigate = useNavigate();

  const form = useForm<AddCourseRequest>({
    resolver: zodResolver(AddCourseRequest),
    values: { title: "" },
  });

  const onSubmit = (data: AddCourseRequest) => {
    addCourseMutation.mutate(data, {
      onSuccess: (res) => {
        toast({ title: t("admin.courses.createdTitle"), description: res.message });
        navigate(`/dashboard/courses/${res.data.id}`, { replace: true });
      },
    });
  };

  return (
    <DashboardPageShell
      title={t("admin.courses.addTitle")}
      description={t("admin.courses.addDescription")}
      icon={BookOpen}
    >
      <DashboardCard className="mx-auto max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.courses.courseTitle")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("admin.courses.courseTitlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("admin.courses.courseTitleHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Link to="/dashboard/courses">
                <Button type="button" variant="outline" className="border-color2/20">
                  {t("admin.courses.cancel")}
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={addCourseMutation.isPending}
                className="bg-gradient-to-r from-color1 to-color2 hover:opacity-90"
              >
                {t("admin.courses.create")}
              </Button>
            </div>
          </form>
        </Form>
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default AddCoursePage;
