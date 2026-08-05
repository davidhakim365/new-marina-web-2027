import {
  CreateStudentRequest,
  useCreateStudentMutation,
} from "@/api/students-api";
import { EGYPT_GOVERNORATES } from "@/api/auth-api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  ADMIN_LEVEL_I18N_KEYS,
  STUDENT_LEVEL_ORDER,
} from "@/lib/student-levels";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const LAST_ADDED_KEY = "add-students:last-added";
const TOTAL_STEPS = 3;

const AddStudentFormSchema = z
  .object({
    mode: z.enum(["online", "offline"]),
    email: z.string().email().min(1, { message: "Email is required" }),
    school: z.string().min(1, { message: "School is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    fullName: z.string().min(3, { message: "Name is required" }),
    phoneNumber: z.string().min(1, { message: "Phone number is required" }),
    parentPhoneNumber: z
      .string()
      .min(1, { message: "Parent phone number is required" }),
    studentCode: z.string().optional(),
    governorate: z.string().min(1, { message: "المحافظة مطلوبة" }),
    level: z.enum(["Level0", "Level1", "Level2", "Level3", "Level4", "Level5"]),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: "custom",
        message: "Passwords do not match",
      });
    }
    if (data.mode === "offline") {
      if (!data.studentCode || data.studentCode.length < 6) {
        ctx.addIssue({
          path: ["studentCode"],
          code: "custom",
          message: "ID must be at least 6 characters",
        });
      }
    }
  });

type AddStudentFormValues = z.infer<typeof AddStudentFormSchema>;

type LastAddedStudent = {
  fullName: string;
  email: string;
  studentCode: string;
  phoneNumber: string;
  level: AddStudentFormValues["level"];
  school: string;
  governorate: string;
  parentPhoneNumber: string;
  mode: AddStudentFormValues["mode"];
};

const emptyDefaults: AddStudentFormValues = {
  mode: "offline",
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  level: "Level0",
  school: "",
  governorate: "",
  parentPhoneNumber: "",
  studentCode: "",
  phoneNumber: "",
};

function getStepFields(
  step: number,
  mode: AddStudentFormValues["mode"]
): (keyof AddStudentFormValues)[] {
  if (step === 0) {
    return mode === "offline" ? ["mode", "studentCode"] : ["mode"];
  }
  if (step === 1) {
    return [
      "fullName",
      "phoneNumber",
      "parentPhoneNumber",
      "level",
      "school",
      "governorate",
    ];
  }
  return ["email", "password", "confirmPassword"];
}

function generateStudentCode() {
  return `ONL-${Math.floor(100000 + Math.random() * 900000)}`;
}

function readLastAdded(): LastAddedStudent | null {
  try {
    const raw = sessionStorage.getItem(LAST_ADDED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastAddedStudent;
  } catch {
    return null;
  }
}

function writeLastAdded(student: LastAddedStudent) {
  sessionStorage.setItem(LAST_ADDED_KEY, JSON.stringify(student));
}

const AddStudentPage = () => {
  const { t } = useTranslation();
  const createStudentMutation = useCreateStudentMutation();
  const [step, setStep] = useState(0);
  const [lastAdded, setLastAdded] = useState<LastAddedStudent | null>(null);
  const modeSelectRef = useRef<HTMLButtonElement | null>(null);

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(AddStudentFormSchema),
    defaultValues: emptyDefaults,
    mode: "onTouched",
  });

  const studyMode = form.watch("mode");

  useEffect(() => {
    setLastAdded(readLastAdded());
  }, []);

  useEffect(() => {
    if (studyMode === "online") {
      form.clearErrors("studentCode");
      form.setValue("studentCode", "");
    }
  }, [studyMode, form]);

  const goNext = async () => {
    const valid = await form.trigger(getStepFields(step, form.getValues("mode")));
    if (!valid) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = (data: AddStudentFormValues) => {
    const studentCode =
      data.mode === "online" ? generateStudentCode() : (data.studentCode ?? "");

    const payload: CreateStudentRequest = {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      fullName: data.fullName,
      level: data.level,
      school: data.school,
      governorate: data.governorate,
      parentPhoneNumber: data.parentPhoneNumber,
      studentCode,
      phoneNumber: data.phoneNumber,
    };

    createStudentMutation.mutate(payload, {
      onSuccess: () => {
        const summary: LastAddedStudent = {
          fullName: data.fullName,
          email: data.email,
          studentCode,
          phoneNumber: data.phoneNumber,
          level: data.level,
          school: data.school,
          governorate: data.governorate,
          parentPhoneNumber: data.parentPhoneNumber,
          mode: data.mode,
        };
        writeLastAdded(summary);
        setLastAdded(summary);
        toast({
          title: t("admin.students.modal.createdTitle"),
          description: t("admin.students.modal.createdDesc"),
        });
        form.reset(emptyDefaults);
        setStep(0);
        requestAnimationFrame(() => modeSelectRef.current?.focus());
      },
    });
  };

  const values = form.watch();
  const stepLabels = [
    t("admin.students.addPage.stepStudyMode"),
    t("admin.students.addPage.stepStudentInfo"),
    t("admin.students.addPage.stepAccount"),
  ];

  return (
    <DashboardPageShell
      title={t("admin.students.addPage.title")}
      description={t("admin.students.addPage.description")}
      icon={UserPlus}
    >
      <div className="mx-auto grid w-full max-w-3xl gap-4">
        <DashboardCard className="border-color2/20 bg-color2/5" padding="sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("admin.students.addPage.lastAddedTitle")}
          </p>
          {lastAdded ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {lastAdded.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastAdded.email}
                </p>
              </div>
              <div className="grid gap-1 text-sm sm:text-end">
                <p>
                  <span className="text-muted-foreground">
                    {t("admin.students.modal.studentId")}:{" "}
                  </span>
                  <span className="font-medium">{lastAdded.studentCode}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t("admin.students.addPage.studyMode")}:{" "}
                  </span>
                  <span className="font-medium">
                    {t(`auth.forms.mode.options.${lastAdded.mode}`)}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t("admin.students.modal.phoneNumber")}:{" "}
                  </span>
                  <span className="font-medium">{lastAdded.phoneNumber}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t("admin.students.modal.level")}:{" "}
                  </span>
                  <span className="font-medium">
                    {t(ADMIN_LEVEL_I18N_KEYS[lastAdded.level])}
                  </span>
                </p>
              </div>
              <p className="text-xs text-color2 sm:col-span-2">
                {t("admin.students.addPage.readyHint")}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("admin.students.addPage.lastAddedEmpty")}
            </p>
          )}
        </DashboardCard>

        <DashboardCard>
          <div className="mb-6">
            <p className="mb-3 text-sm text-muted-foreground">
              {t("admin.students.addPage.stepOf", {
                current: step + 1,
                total: TOTAL_STEPS,
              })}
            </p>
            <ol className="flex items-center gap-2">
              {stepLabels.map((label, index) => {
                const done = index < step;
                const active = index === step;
                return (
                  <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        done && "bg-color2 text-white",
                        active &&
                          "bg-gradient-to-r from-color1 to-color2 text-white",
                        !done && !active && "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span
                      className={cn(
                        "truncate text-sm",
                        active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                    {index < stepLabels.length - 1 && (
                      <div className="mx-1 hidden h-px flex-1 bg-border sm:block" />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (step < TOTAL_STEPS - 1) {
                  e.preventDefault();
                  void goNext();
                }
              }}
            >
              <fieldset
                disabled={createStudentMutation.isPending}
                className="space-y-4"
              >
                {step === 0 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("admin.students.addPage.studyMode")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger ref={modeSelectRef}>
                                <SelectValue
                                  placeholder={t(
                                    "admin.students.addPage.studyModePlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="offline">
                                {t("auth.forms.mode.options.offline")}
                              </SelectItem>
                              <SelectItem value="online">
                                {t("auth.forms.mode.options.online")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {studyMode === "online"
                              ? t("admin.students.addPage.onlineIdHint")
                              : t("admin.students.addPage.offlineIdHint")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {studyMode === "offline" && (
                      <FormField
                        control={form.control}
                        name="studentCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("admin.students.modal.studentId")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>
                            {t("admin.students.modal.fullName")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("admin.students.modal.phoneNumber")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentPhoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("admin.students.modal.parentPhoneNumber")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.students.modal.level")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "admin.students.modal.levelPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STUDENT_LEVEL_ORDER.map((lvl) => (
                                <SelectItem key={lvl} value={lvl}>
                                  {t(ADMIN_LEVEL_I18N_KEYS[lvl])}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="school"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("admin.students.modal.schoolName")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="governorate"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>
                            {t("admin.students.modal.governorate")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "admin.students.modal.governoratePlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EGYPT_GOVERNORATES.map((gov) => (
                                <SelectItem key={gov} value={gov}>
                                  {gov}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>
                              {t("admin.students.modal.email")}
                            </FormLabel>
                            <FormControl>
                              <Input type="email" autoComplete="off" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("admin.students.modal.password")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                autoComplete="new-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("admin.students.modal.confirmPassword")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                autoComplete="new-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <p className="mb-2 text-sm font-medium">
                        {t("admin.students.addPage.reviewTitle")}
                      </p>
                      <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">
                            {t("admin.students.addPage.studyMode")}
                          </dt>
                          <dd className="font-medium">
                            {t(`auth.forms.mode.options.${values.mode}`)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("admin.students.modal.studentId")}
                          </dt>
                          <dd className="font-medium">
                            {values.mode === "online"
                              ? t("admin.students.addPage.onlineIdAuto")
                              : values.studentCode || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("admin.students.modal.fullName")}
                          </dt>
                          <dd className="font-medium">
                            {values.fullName || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("admin.students.modal.email")}
                          </dt>
                          <dd className="font-medium">{values.email || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("admin.students.modal.level")}
                          </dt>
                          <dd className="font-medium">
                            {t(ADMIN_LEVEL_I18N_KEYS[values.level])}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("admin.students.modal.phoneNumber")}
                          </dt>
                          <dd className="font-medium">
                            {values.phoneNumber || "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={step === 0 || createStudentMutation.isPending}
                  >
                    <ChevronLeft className="me-1 h-4 w-4" />
                    {t("admin.students.addPage.back")}
                  </Button>

                  {step < TOTAL_STEPS - 1 ? (
                    <Button type="button" onClick={() => void goNext()}>
                      {t("admin.students.addPage.next")}
                      <ChevronRight className="ms-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createStudentMutation.isPending}
                    >
                      {t("admin.students.addPage.create")}
                    </Button>
                  )}
                </div>
              </fieldset>
            </form>
          </Form>
        </DashboardCard>
      </div>
    </DashboardPageShell>
  );
};

export default AddStudentPage;
