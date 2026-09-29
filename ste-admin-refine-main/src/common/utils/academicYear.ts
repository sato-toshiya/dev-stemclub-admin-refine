export type AcademicStatus = "active" | "pending" | "archived";

export const academicStatusJa = (s?: string) => {
  switch (s) {
    case "active":
      return "アクティブ";
    case "pending":
      return "準備中";
    case "archived":
      return "終了";
    default:
      return s ?? "";
  }
};

export type AcademicStatusTagColor = "green" | "orange" | "default";

export const academicStatusColor = (s?: string): AcademicStatusTagColor => {
  switch (s) {
    case "active":
      return "green";
    case "pending":
      return "orange";
    case "archived":
      return "default";
    default:
      return "default";
  }
};

export const ACADEMIC_STATUS_OPTIONS = [
  { label: "準備中", value: "pending" },
  { label: "アクティブ", value: "active" },
  { label: "終了", value: "archived" },
] as const;
