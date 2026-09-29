import { TreeNodeType } from "../types";

export const nodeKey = (type: TreeNodeType, docId: string) =>
  `${type}:${docId}` as const;

export const dayNodeKey = (classDocId: string, dateYmd: string) =>
  `day:${classDocId}:${dateYmd}` as const;

export type ParsedNodeKey =
  | { type: Exclude<TreeNodeType, "day">; docId: string }
  | { type: "day"; docId: string; date: string };

export const parseNodeKey = (key: string): ParsedNodeKey => {
  const parts = key.split(":");
  const typeRaw = (parts[0] ?? "") as TreeNodeType;

  if (typeRaw === "day") {
    const classDocId = parts[1] ?? "";
    const date = parts[2] ?? "";
    return { type: "day", docId: classDocId, date };
  }

  const docId = parts[1] ?? "";
  const type = (typeRaw as TreeNodeType) ?? "year";
  return { type, docId } as ParsedNodeKey;
};
