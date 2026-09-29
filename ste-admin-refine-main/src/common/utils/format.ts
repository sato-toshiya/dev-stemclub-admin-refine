import dayjs from "dayjs";
import "dayjs/locale/ja";

export const fmtBreadcrumb = (y?: string, c?: string, s?: string) =>
  [y, c, s].filter(Boolean).join(" / ") || "—";

export const toMBText = (v?: number) => {
  if (typeof v !== "number" || Number.isNaN(v)) return "-";
  return `${v.toFixed(v >= 10 ? 1 : 2)}KB`;
};

export const fmtDate = (v?: string) =>
  v ? dayjs(v).format("YYYY-MM-DD") : "-";

export const fmtDateTime = (v?: string) =>
  v ? dayjs(v).format("YYYY/MM/DD HH:mm") : "---";

export const fmtDateJa = (v?: string) => {
  if (!v) return "-";
  return dayjs(v).format("YYYY年MM月DD日");
};

export const fmtDateJaWithDay = (v?: string) => {
  if (!v) return "-";
  return dayjs(v).locale("ja").format("YYYY年MM月DD日 (ddd)");
};
