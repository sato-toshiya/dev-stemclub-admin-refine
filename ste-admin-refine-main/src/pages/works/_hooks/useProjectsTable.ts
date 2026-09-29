import { useEffect, useMemo, useCallback } from "react";
import { useTable } from "@refinedev/antd";
import type { Dayjs } from "dayjs";
import type { TablePaginationConfig } from "antd";
import type { ProjectRecord, SortKey } from "@/common/types";
import dayjs from "dayjs";

const toIsoStart = (d: Dayjs) => d.startOf("day").toISOString();
const toIsoEnd = (d: Dayjs) => d.endOf("day").toISOString();

type Mode = "student" | "classDay";

export const useProjectsTable = ({
  mode,
  studentDocId,
  classDocId,
  classDay,
  range,
  sortKey,
}: {
  mode: Mode;
  studentDocId?: string;
  classDocId?: string;
  classDay?: Dayjs | null;
  range: [Dayjs | null, Dayjs | null];
  sortKey: SortKey;
}) => {
  const effectiveDay = useMemo(() => {
    if (mode !== "classDay") return null;
    return classDay ?? dayjs();
  }, [mode, classDay]);

  const enabled = useMemo(() => {
    if (mode === "student") return !!studentDocId;
    return !!classDocId;
  }, [mode, studentDocId, classDocId]);

  const meta = useMemo(() => {
    if (mode === "student") {
      const [from, to] = range;

      return {
        endpoint: "projects/by-student",
        fields: ["documentId", "title", "file_size", "createdAt", "updatedAt"],
        populate: { thumbnail: true },
        query: {
          ...(studentDocId ? { student: studentDocId } : {}),
          ...(from ? { from: toIsoStart(from) } : {}),
          ...(to ? { to: toIsoEnd(to) } : {}),
          sortKey,
        },
      };
    }

    const d = effectiveDay;
    return {
      endpoint: "projects/by-class",
      fields: ["documentId", "title", "file_size", "createdAt", "updatedAt"],
      populate: {
        thumbnail: true,
        student: { fields: ["name", "code", "documentId"] },
      },
      query: {
        ...(classDocId ? { class: classDocId } : {}),
        ...(d ? { from: toIsoStart(d), to: toIsoEnd(d) } : {}),
        sortKey,
      },
    };
  }, [mode, studentDocId, classDocId, effectiveDay, range, sortKey]);

  const {
    tableProps,
    setCurrentPage,
    setPageSize,
    tableQuery,
    currentPage,
    pageSize,
  } = useTable<ProjectRecord>({
    resource: "projects",
    meta,
    pagination: { pageSize: 15 },
    queryOptions: { enabled },
  });

  const rangeKey = useMemo(() => {
    const a = range?.[0]?.valueOf() ?? 0;
    const b = range?.[1]?.valueOf() ?? 0;
    return `${a}-${b}`;
  }, [range]);

  const dayKey = useMemo(() => effectiveDay?.valueOf() ?? 0, [effectiveDay]);

  useEffect(() => {
    if (!enabled) return;
    setCurrentPage?.(1);
  }, [
    enabled,
    mode,
    studentDocId,
    classDocId,
    rangeKey,
    dayKey,
    sortKey,
    setCurrentPage,
  ]);

  const resetPage = useCallback(() => setCurrentPage?.(1), [setCurrentPage]);

  const refetch = useCallback(() => {
    tableQuery?.refetch?.();
  }, [tableQuery]);

  const isFetching = !!tableQuery?.isFetching;

  const pagination =
    tableProps.pagination !== false
      ? (tableProps.pagination as TablePaginationConfig)
      : undefined;

  const total = pagination?.total;

  return {
    tableProps,
    resetPage,
    refetch,
    isFetching,

    currentPage,
    pageSize,
    total,

    setCurrentPage,
    setPageSize,
  };
};
