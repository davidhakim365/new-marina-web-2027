import { StudentLevel } from "@/generated/model";

/** Pedagogical display order: prep → 1st year (general then bac) → 2nd year (general then bac). */
export const STUDENT_LEVEL_ORDER = [
  StudentLevel.Level0,
  StudentLevel.Level1,
  StudentLevel.Level2,
  StudentLevel.Level4,
  StudentLevel.Level3,
  StudentLevel.Level5,
] as const;

export type StudentLevelValue =
  | "Level0"
  | "Level1"
  | "Level2"
  | "Level3"
  | "Level4"
  | "Level5";

export const STUDENT_LEVEL_ZOD = [
  "Level0",
  "Level1",
  "Level2",
  "Level3",
  "Level4",
  "Level5",
] as const;

/** English labels for places that are not i18n-wired yet. */
export const STUDENT_LEVEL_LABELS_EN: Record<StudentLevelValue, string> = {
  Level0: "2nd Prep",
  Level1: "3rd Prep",
  Level2: "1st Secondary General",
  Level3: "2nd Secondary General",
  Level4: "1st Secondary Baccalaureate",
  Level5: "2nd Secondary Baccalaureate",
};

export const ADMIN_LEVEL_I18N_KEYS: Record<
  StudentLevelValue,
  | "admin.levels.level0"
  | "admin.levels.level1"
  | "admin.levels.level2"
  | "admin.levels.level3"
  | "admin.levels.level4"
  | "admin.levels.level5"
> = {
  Level0: "admin.levels.level0",
  Level1: "admin.levels.level1",
  Level2: "admin.levels.level2",
  Level3: "admin.levels.level3",
  Level4: "admin.levels.level4",
  Level5: "admin.levels.level5",
};

export const LATEST_LECTURES_LEVEL_I18N_KEYS: Record<
  StudentLevelValue,
  | "latestLectures.levels.level0"
  | "latestLectures.levels.level1"
  | "latestLectures.levels.level2"
  | "latestLectures.levels.level3"
  | "latestLectures.levels.level4"
  | "latestLectures.levels.level5"
> = {
  Level0: "latestLectures.levels.level0",
  Level1: "latestLectures.levels.level1",
  Level2: "latestLectures.levels.level2",
  Level3: "latestLectures.levels.level3",
  Level4: "latestLectures.levels.level4",
  Level5: "latestLectures.levels.level5",
};

export const AUTH_LEVEL_I18N_KEYS: Record<
  StudentLevelValue,
  | "auth.forms.level.options.level0"
  | "auth.forms.level.options.level1"
  | "auth.forms.level.options.level2"
  | "auth.forms.level.options.level3"
  | "auth.forms.level.options.level4"
  | "auth.forms.level.options.level5"
> = {
  Level0: "auth.forms.level.options.level0",
  Level1: "auth.forms.level.options.level1",
  Level2: "auth.forms.level.options.level2",
  Level3: "auth.forms.level.options.level3",
  Level4: "auth.forms.level.options.level4",
  Level5: "auth.forms.level.options.level5",
};
