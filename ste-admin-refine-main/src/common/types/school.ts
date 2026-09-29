import type { BaseRecord } from "@refinedev/core";

export type AcademicStatus = "active" | "pending" | "archived";

export type AcademicYearRecord = BaseRecord & {
  documentId: string;
  name?: string;
  academic_status?: AcademicStatus;
};

export type ClassRecord = BaseRecord & {
  documentId: string;
  name?: string;
  academic_year?: { documentId: string; name?: string } | null;
};

export type UsersPermissionsUserRecord = BaseRecord & {
  documentId: string;
  email?: string;
  phone?: string | null;
  blocked?: boolean;
};

export type StudentRecord = BaseRecord & {
  documentId: string;
  name?: string;
  class?: { documentId: string; name?: string } | null;
  school_admin?: { documentId: string; name?: string } | null;
  users_permissions_user?: UsersPermissionsUserRecord | null;
  projectsCount?: number;
};
