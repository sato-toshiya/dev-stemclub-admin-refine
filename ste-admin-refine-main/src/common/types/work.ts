import type { BaseRecord } from "@refinedev/core";
import type { MediaThumbnail } from "./media";

export type SortKey = "newest" | "oldest" | "title_asc" | "title_desc";

export type ProjectRecord = BaseRecord & {
  documentId: string;
  title?: string;
  file_size?: number;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: MediaThumbnail | null;
  student?: { documentId: string; name?: string } | null;
};

export type TreeNodeType = "year" | "class" | "student" | "day";
export type TreeKey = string;

export const EXP_KEY = "exp";
export const LS_EXP = "wm_expandedKeys";
