export type PermissionGroupId =
  | "content"
  | "students"
  | "finance"
  | "team"
  | "callCenter"
  | "rewards"
  | "other";

export type PermissionMeta = {
  key: string;
  group: PermissionGroupId;
  titleKey: string;
  descriptionKey: string;
};

/** Display order of permission groups on the assistant details page. */
export const PERMISSION_GROUP_ORDER: PermissionGroupId[] = [
  "content",
  "students",
  "callCenter",
  "finance",
  "rewards",
  "team",
  "other",
];

export const PERMISSION_GROUP_TITLE_KEYS: Record<PermissionGroupId, string> = {
  content: "admin.assistants.permissionGroups.content",
  students: "admin.assistants.permissionGroups.students",
  callCenter: "admin.assistants.permissionGroups.callCenter",
  finance: "admin.assistants.permissionGroups.finance",
  rewards: "admin.assistants.permissionGroups.rewards",
  team: "admin.assistants.permissionGroups.team",
  other: "admin.assistants.permissionGroups.other",
};

const PERMISSION_META: Record<string, Omit<PermissionMeta, "key">> = {
  ViewStatistics: {
    group: "content",
    titleKey: "admin.assistants.permissionLabels.ViewStatistics.title",
    descriptionKey: "admin.assistants.permissionLabels.ViewStatistics.description",
  },
  ManageCourses: {
    group: "content",
    titleKey: "admin.assistants.permissionLabels.ManageCourses.title",
    descriptionKey: "admin.assistants.permissionLabels.ManageCourses.description",
  },
  ManageLecture: {
    group: "content",
    titleKey: "admin.assistants.permissionLabels.ManageLecture.title",
    descriptionKey: "admin.assistants.permissionLabels.ManageLecture.description",
  },
  ManageFiles: {
    group: "content",
    titleKey: "admin.assistants.permissionLabels.ManageFiles.title",
    descriptionKey: "admin.assistants.permissionLabels.ManageFiles.description",
  },
  ManageStudents: {
    group: "students",
    titleKey: "admin.assistants.permissionLabels.ManageStudents.title",
    descriptionKey: "admin.assistants.permissionLabels.ManageStudents.description",
  },
  ManageGrantedAccess: {
    group: "students",
    titleKey: "admin.assistants.permissionLabels.ManageGrantedAccess.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ManageGrantedAccess.description",
  },
  ManageExpirationTime: {
    group: "students",
    titleKey: "admin.assistants.permissionLabels.ManageExpirationTime.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ManageExpirationTime.description",
  },
  ManageCallCenter: {
    group: "callCenter",
    titleKey: "admin.assistants.permissionLabels.ManageCallCenter.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ManageCallCenter.description",
  },
  ViewCallCenterHistory: {
    group: "callCenter",
    titleKey: "admin.assistants.permissionLabels.ViewCallCenterHistory.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ViewCallCenterHistory.description",
  },
  ManageCreditCodes: {
    group: "finance",
    titleKey: "admin.assistants.permissionLabels.ManageCreditCodes.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ManageCreditCodes.description",
  },
  GenerateCreditCodes: {
    group: "finance",
    titleKey: "admin.assistants.permissionLabels.GenerateCreditCodes.title",
    descriptionKey:
      "admin.assistants.permissionLabels.GenerateCreditCodes.description",
  },
  ManageStudentApples: {
    group: "rewards",
    titleKey: "admin.assistants.permissionLabels.ManageStudentApples.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ManageStudentApples.description",
  },
  ManageAppleRewardsStore: {
    group: "rewards",
    titleKey: "admin.assistants.permissionLabels.ManageAppleRewardsStore.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ManageAppleRewardsStore.description",
  },
  ManageAssistants: {
    group: "team",
    titleKey: "admin.assistants.permissionLabels.ManageAssistants.title",
    descriptionKey:
      "admin.assistants.permissionLabels.ManageAssistants.description",
  },
};

export function getPermissionMeta(permission: string): PermissionMeta {
  const meta = PERMISSION_META[permission];
  if (meta) {
    return { key: permission, ...meta };
  }
  return {
    key: permission,
    group: "other",
    titleKey: permission,
    descriptionKey: "",
  };
}

export function groupPermissions(permissions: string[]) {
  const groups = new Map<PermissionGroupId, PermissionMeta[]>();

  for (const permission of permissions) {
    const meta = getPermissionMeta(permission);
    const list = groups.get(meta.group) ?? [];
    list.push(meta);
    groups.set(meta.group, list);
  }

  return PERMISSION_GROUP_ORDER.filter((group) => groups.has(group)).map(
    (group) => ({
      group,
      titleKey: PERMISSION_GROUP_TITLE_KEYS[group],
      items: groups.get(group)!,
    })
  );
}
