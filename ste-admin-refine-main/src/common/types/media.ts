import type { BaseRecord } from "@refinedev/core";

export type MediaThumbnail = BaseRecord & {
  documentId: string;
  url: string;
  width?: number | null;
  height?: number | null;
  name?: string;
  mime?: string;
  size?: number;
};
