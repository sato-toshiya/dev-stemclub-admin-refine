import type { BaseRecord } from "@refinedev/core";

export type StudentRecord = BaseRecord & {
  documentId?: string;
  name?: string;
  name_kana?: string;
  birthday?: string;
  guardian_name?: string;
  class?: { name?: string; documentId?: string } | null;
  projects?: Array<{ id?: number | string }> | null;
  users_permissions_user?: {
    id?: number | string;
    email?: string;
    last_login_at?: string;
    lastLoginAt?: string;
  } | null;
  last_login_at?: string;
  projectsCount?: string;
  last_seen_at?: string;
};

export type ImportResult = {
  created: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
};
