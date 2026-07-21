import {
  CreateStudentRequest,
  useCreateStudentMutation,
} from "@/api/students-api";
import { EGYPT_GOVERNORATES } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ADMIN_LEVEL_I18N_KEYS,
  STUDENT_LEVEL_ORDER,
} from "@/lib/student-levels";

interface AddStudentModalProps {
  onClose: () => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const createStudentMutation = useCreateStudentMutation();

  const form = useForm<CreateStudentRequest>({
    resolver: zodResolver(CreateStudentRequest),
    values: {
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
    },
    defaultValues: {
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
    },
  });

  const onSubmit = (data: CreateStudentRequest) => {
    createStudentMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: t("admin.students.modal.createdTitle"),
          description: t("admin.students.modal.createdDesc"),
        });
        onClose();
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>{t("admin.students.modal.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.students.modal.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset
              disabled={createStudentMutation.isPending}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <FormField
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.fullName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.email")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.phoneNumber")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
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
                name="studentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.studentId")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.schoolName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="governorate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.governorate")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <FormField
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.level")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.students.modal.password")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("admin.students.modal.confirmPassword")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">{t("admin.students.modal.submit")}</Button>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentModal;
