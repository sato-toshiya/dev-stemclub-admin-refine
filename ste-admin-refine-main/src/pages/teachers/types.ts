import type { BaseRecord } from "@refinedev/core";

export type TeacherRecord = BaseRecord & {
  documentId?: string;
  name?: string;
  email?: string;
  phone?: string;
  passcode?: string;
  classes?: Array<{ name?: string; documentId?: string }> | null;
  users_permissions_user?: {
    email?: string;
    phone?: string;
    blocked?: boolean;
  } | null;
};

export type ImportResult = {
  created: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
};
