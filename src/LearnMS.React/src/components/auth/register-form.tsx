import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterRequest,
  useRegisterMutation,
  useLoginMutation,
  EGYPT_GOVERNORATES,
  checkStudentAvailability,
} from "@/api/auth-api";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn, getSafeInternalPath } from "@/lib/utils";
import InputField from "./input-field";
import { useTranslation } from "react-i18next";
import {
  AUTH_LEVEL_I18N_KEYS,
  STUDENT_LEVEL_ORDER,
} from "@/lib/student-levels";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button as ShadButton } from "@/components/ui/button";
import { motion } from "framer-motion";

interface RegisterFormProps {
  setIsLoginView: (value: boolean) => void;
}

const TOTAL_STEPS = 3;

function getStepFields(
  step: number,
  mode: RegisterRequest["mode"]
): (keyof RegisterRequest)[] {
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

const RegisterForm = ({ setIsLoginView }: RegisterFormProps) => {
  const [passwordShown, setPasswordShown] = useState(false);
  const [step, setStep] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const location = useLocation();

  const registerForm = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequest),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      level: "" as RegisterRequest["level"],
      phoneNumber: "",
      school: "",
      governorate: "",
      parentPhoneNumber: "",
      studentCode: "",
      mode: "offline",
    },
    mode: "onTouched",
  });

  const mode = registerForm.watch("mode");
  const values = registerForm.watch();
  const registerErrors = registerForm.formState.errors;

  const formContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const inputVariants = useMemo(
    () => ({
      initial: {
        opacity: 0,
        x: isRTL ? -150 : 150,
        filter: "blur(10px)",
      },
      animate: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
          duration: 0.5,
          ease: "easeOut",
        },
      },
      exit: {
        opacity: 0,
        x: isRTL ? 150 : -150,
        filter: "blur(10px)",
        transition: {
          duration: 0.25,
          ease: "easeIn",
        },
      },
    }),
    [isRTL]
  );

  const gridContainerVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const goNext = async () => {
    const fields = getStepFields(step, registerForm.getValues("mode"));
    const valid = await registerForm.trigger(fields);
    if (!valid) return;

    setCheckingAvailability(true);
    try {
      const values = registerForm.getValues();

      if (step === 0 && values.mode === "offline" && values.studentCode) {
        const availability = await checkStudentAvailability({
          studentCode: values.studentCode,
        });
        if (!availability.studentCodeAvailable) {
          registerForm.setError("studentCode", {
            type: "manual",
            message: t("auth.forms.errors.studentCodeTaken"),
          });
          return;
        }
      }

      if (step === 1) {
        const availability = await checkStudentAvailability({
          phoneNumber: values.phoneNumber,
        });
        if (!availability.phoneNumberAvailable) {
          registerForm.setError("phoneNumber", {
            type: "manual",
            message: t("auth.forms.errors.phoneTaken"),
          });
          return;
        }
      }

      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    } catch {
      toast({
        title: t("auth.forms.errors.registrationFailed"),
        description: t("auth.forms.errors.availabilityCheckFailed"),
        variant: "destructive",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onRegister = async (data: RegisterRequest) => {
    try {
      setCheckingAvailability(true);
      const emailCheck = await checkStudentAvailability({ email: data.email });
      if (!emailCheck.emailAvailable) {
        registerForm.setError("email", {
          type: "manual",
          message: t("auth.forms.errors.emailTaken"),
        });
        return;
      }
      setCheckingAvailability(false);

      let studentCode =
        data.mode === "online" ? generateStudentCode() : data.studentCode;

      if (data.mode === "online") {
        for (let attempt = 0; attempt < 5; attempt++) {
          const codeCheck = await checkStudentAvailability({ studentCode });
          if (codeCheck.studentCodeAvailable) break;
          studentCode = generateStudentCode();
        }
      }

      const payload: RegisterRequest = {
        ...data,
        studentCode,
      };

      await registerMutation.mutateAsync(payload);

      const loginResult = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      if (loginResult.status) {
        toast({
          title: t("auth.forms.errors.accountCreated"),
          description: t("auth.forms.errors.welcomeBack"),
        });
        navigate(
          getSafeInternalPath(
            (location.state as { from?: unknown } | null)?.from
          ) ?? "/"
        );
      } else {
        toast({
          title: t("auth.forms.success.registrationTitle"),
          description: t("auth.forms.success.registrationDescription"),
        });
        setIsLoginView(true);
      }
    } catch (error) {
      const apiError = error as {
        code?: string;
        message?: string;
        response?: { data?: { code?: string; message?: string } };
      };
      const errorCode = apiError.code || apiError.response?.data?.code;
      const alreadyRegisteredMessageByCode: Record<string, string> = {
        "auth/email-already-exists": t("auth.forms.errors.emailTaken"),
        "auth/email-already-code": t("auth.forms.errors.studentCodeTaken"),
        "auth/phone-already-exists": t("auth.forms.errors.phoneTaken"),
      };
      const errorMessage =
        (errorCode && alreadyRegisteredMessageByCode[errorCode]) ||
        apiError.message ||
        apiError.response?.data?.message ||
        t("auth.forms.errors.registrationFailed");
      toast({
        title: t("auth.forms.errors.registrationFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const isPending =
    registerMutation.isPending ||
    loginMutation.isPending ||
    checkingAvailability;

  const stepLabels = [
    t("auth.forms.steps.studyMode"),
    t("auth.forms.steps.studentInfo"),
    t("auth.forms.steps.account"),
  ];

  return (
    <motion.form
      variants={formContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onSubmit={registerForm.handleSubmit(onRegister)}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        if (step < TOTAL_STEPS - 1) {
          e.preventDefault();
          void goNext();
        }
      }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("auth.forms.steps.stepOf", {
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
                    done && "bg-emerald-500 text-white",
                    active && "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
                    !done && !active && "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "truncate text-sm",
                    active
                      ? "font-medium text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {step === 0 && (
        <>
          <motion.div variants={inputVariants}>
            <label
              htmlFor="mode"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t("auth.forms.mode.label")}
            </label>
            <Controller
              control={registerForm.control}
              name="mode"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-zinc-800">
                    <SelectValue
                      placeholder={t("auth.forms.mode.placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">
                      {t("auth.forms.mode.options.offline")}
                    </SelectItem>
                    <SelectItem value="online">
                      {t("auth.forms.mode.options.online")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {registerErrors?.mode && (
              <p className="text-sm text-red-400 dark:text-red-300">
                {registerErrors.mode.message}
              </p>
            )}
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {mode === "online"
                ? t("auth.forms.steps.onlineIdHint")
                : t("auth.forms.steps.offlineIdHint")}
            </p>
          </motion.div>

          {mode === "offline" && (
            <motion.div variants={inputVariants}>
              <InputField
                error={registerErrors?.studentCode}
                register={registerForm.register}
                placeholder={t("auth.forms.studentCode.placeholder")}
                name="studentCode"
                label={t("auth.forms.studentCode.label")}
              />
            </motion.div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <motion.div variants={inputVariants}>
            <InputField
              error={registerErrors?.fullName}
              register={registerForm.register}
              placeholder={t("auth.forms.fullName.placeholder")}
              name="fullName"
              label={t("auth.forms.fullName.label")}
            />
          </motion.div>

          <motion.div
            variants={gridContainerVariants}
            className="grid grid-cols-2 gap-6"
          >
            <motion.div variants={inputVariants}>
              <InputField
                error={registerErrors?.phoneNumber}
                register={registerForm.register}
                placeholder={t("auth.forms.phoneNumber.placeholder")}
                name="phoneNumber"
                label={t("auth.forms.phoneNumber.label")}
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <InputField
                error={registerErrors?.parentPhoneNumber}
                register={registerForm.register}
                placeholder={t("auth.forms.parentPhoneNumber.placeholder")}
                name="parentPhoneNumber"
                label={t("auth.forms.parentPhoneNumber.label")}
              />
            </motion.div>
          </motion.div>

          <motion.div
            variants={gridContainerVariants}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2"
          >
            <motion.div variants={inputVariants} className="space-y-2">
              <label
                htmlFor="level"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("auth.forms.level.label")}
              </label>
              <Controller
                control={registerForm.control}
                name="level"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="level"
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600",
                        registerErrors?.level
                          ? "border-red-400 dark:border-red-300"
                          : "border-zinc-200 dark:border-zinc-700"
                      )}
                    >
                      <SelectValue
                        placeholder={t("auth.forms.level.placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_LEVEL_ORDER.map((level) => (
                        <SelectItem key={level} value={level}>
                          {t(AUTH_LEVEL_I18N_KEYS[level])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {registerErrors?.level && (
                <p className="text-sm text-red-400 dark:text-red-300">
                  {registerErrors.level.message}
                </p>
              )}
            </motion.div>

            <motion.div variants={inputVariants} className="space-y-2">
              <label
                htmlFor="governorate"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("auth.forms.governorate.label")}
              </label>
              <Controller
                control={registerForm.control}
                name="governorate"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="governorate"
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border bg-white dark:bg-zinc-800",
                        registerErrors?.governorate
                          ? "border-red-400 dark:border-red-300"
                          : "border-zinc-200 dark:border-zinc-700"
                      )}
                    >
                      <SelectValue
                        placeholder={t("auth.forms.governorate.placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <SelectItem key={gov} value={gov}>
                          {gov}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {registerErrors?.governorate && (
                <p className="text-sm text-red-400 dark:text-red-300">
                  {registerErrors.governorate.message}
                </p>
              )}
            </motion.div>

            <motion.div variants={inputVariants} className="sm:col-span-2">
              <InputField
                error={registerErrors?.school}
                register={registerForm.register}
                placeholder={t("auth.forms.school.placeholder")}
                name="school"
                label={t("auth.forms.school.label")}
              />
            </motion.div>
          </motion.div>
        </>
      )}

      {step === 2 && (
        <>
          <motion.div variants={inputVariants}>
            <InputField
              type="email"
              error={registerErrors?.email}
              register={registerForm.register}
              placeholder={t("auth.forms.email.placeholder")}
              name="email"
              label={t("auth.forms.email.label")}
            />
          </motion.div>

          <motion.div variants={inputVariants}>
            <InputField
              error={registerErrors?.password}
              register={registerForm.register}
              placeholder={t("auth.forms.password.placeholder")}
              isPassword
              name="password"
              label={t("auth.forms.password.label")}
              passwordShown={passwordShown}
              setPasswordShown={setPasswordShown}
            />
          </motion.div>

          <motion.div variants={inputVariants}>
            <InputField
              error={registerErrors?.confirmPassword}
              register={registerForm.register}
              placeholder={t("auth.forms.confirmPassword.placeholder")}
              isPassword
              name="confirmPassword"
              label={t("auth.forms.confirmPassword.label")}
              passwordShown={passwordShown}
              setPasswordShown={setPasswordShown}
            />
          </motion.div>

          <motion.div
            variants={inputVariants}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60"
          >
            <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("auth.forms.steps.reviewTitle")}
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.mode.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {t(`auth.forms.mode.options.${values.mode}`)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.studentCode.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {values.mode === "online"
                    ? t("auth.forms.steps.onlineIdAuto")
                    : values.studentCode || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.fullName.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {values.fullName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.phoneNumber.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {values.phoneNumber || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.parentPhoneNumber.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {values.parentPhoneNumber || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.level.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {values.level
                    ? t(AUTH_LEVEL_I18N_KEYS[values.level])
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.school.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {values.school || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {t("auth.forms.governorate.label")}
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {values.governorate || "—"}
                </dd>
              </div>
            </dl>
          </motion.div>
        </>
      )}

      <motion.div
        variants={inputVariants}
        className="flex items-center justify-between gap-3"
      >
        <ShadButton
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === 0 || isPending}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("auth.forms.steps.back")}
        </ShadButton>

        {step < TOTAL_STEPS - 1 ? (
          <ShadButton
            type="button"
            onClick={() => void goNext()}
            disabled={isPending}
            className="gap-1"
          >
            {checkingAvailability ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {t("auth.forms.steps.next")}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </ShadButton>
        ) : (
          <ShadButton
            type="submit"
            disabled={isPending}
            size="lg"
            className="flex gap-2 items-center justify-center"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            <span>
              {isPending
                ? loginMutation.isPending
                  ? t("auth.forms.steps.loggingIn")
                  : t("auth.forms.steps.creating")
                : t("auth.forms.createAccount")}
            </span>
          </ShadButton>
        )}
      </motion.div>
    </motion.form>
  );
};

export default RegisterForm;
